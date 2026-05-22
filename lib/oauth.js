import crypto from "crypto";

function baseUrl(req) {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`
    );
}

export function getOAuthConfig(provider, req) {
    const redirectUri = `${baseUrl(req)}/api/auth/oauth/callback/${provider}`;

    if (provider === "google") {
        return {
            provider,
            label: "Google",
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
            redirectUri,
            scope: "openid email profile",
        };
    }

    if (provider === "github") {
        return {
            provider,
            label: "GitHub",
            clientId: process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorizeUrl: "https://github.com/login/oauth/authorize",
            tokenUrl: "https://github.com/login/oauth/access_token",
            userInfoUrl: "https://api.github.com/user",
            emailsUrl: "https://api.github.com/user/emails",
            redirectUri,
            scope: "read:user user:email",
        };
    }

    return null;
}

export function oauthConfigured(config) {
    return Boolean(config?.clientId && config?.clientSecret);
}

export function createOAuthState() {
    return crypto.randomBytes(24).toString("hex");
}

export function buildAuthorizeUrl(config, state) {
    const url = new URL(config.authorizeUrl);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("state", state);

    if (config.provider === "google") {
        url.searchParams.set("prompt", "select_account");
        url.searchParams.set("access_type", "online");
    }

    return url.toString();
}

export async function exchangeCodeForToken(config, code) {
    const params = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
    });

    if (config.provider === "google") {
        params.set("grant_type", "authorization_code");
    }

    const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || data.error || "Failed to exchange OAuth code.");
    }

    return data.access_token;
}

export async function fetchSocialProfile(config, accessToken) {
    if (config.provider === "google") {
        const response = await fetch(config.userInfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        if (!response.ok || !data.email) {
            throw new Error("Unable to read Google profile.");
        }

        return {
            provider: "google",
            providerId: data.sub,
            email: data.email,
            name: data.name || data.email,
            avatar: data.picture || "",
        };
    }

    const userResponse = await fetch(config.userInfoUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "movie-finder-v2",
        },
    });
    const userData = await userResponse.json();
    if (!userResponse.ok) {
        throw new Error("Unable to read GitHub profile.");
    }

    const emailsResponse = await fetch(config.emailsUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "movie-finder-v2",
        },
    });
    const emailsData = await emailsResponse.json();
    const primaryEmail = Array.isArray(emailsData)
        ? emailsData.find((item) => item.primary)?.email || emailsData.find((item) => item.verified)?.email
        : null;

    if (!primaryEmail) {
        throw new Error("Your GitHub account needs a verified email before it can sign in.");
    }

    return {
        provider: "github",
        providerId: String(userData.id),
        email: primaryEmail,
        name: userData.name || userData.login || primaryEmail,
        avatar: userData.avatar_url || "",
    };
}
