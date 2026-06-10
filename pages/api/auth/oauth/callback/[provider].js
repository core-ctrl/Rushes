import cookie from "cookie";
import { loginOrCreateSocialUser } from "@/services/authService";
import { exchangeCodeForToken, fetchSocialProfile, getOAuthConfig, oauthConfigured } from "@/lib/oauth";

function baseUrl(req) {
    return process.env.NEXT_PUBLIC_APP_URL || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
}

function authRedirect(req, query) {
    return `${baseUrl(req)}/?${new URLSearchParams(query).toString()}`;
}

export default async function handler(req, res) {
    const provider = String(req.query.provider || "");
    const { code, state } = req.query;
    const config = getOAuthConfig(provider, req);

    if (!config || !oauthConfigured(config)) {
        return res.redirect(authRedirect(req, { authMode: "login", authError: "Social sign-in is not configured." }));
    }

    const cookies = cookie.parse(req.headers.cookie || "");
    const expectedState = cookies[`oauth_state_${provider}`];

    res.setHeader(
        "Set-Cookie",
        cookie.serialize(`oauth_state_${provider}`, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
        })
    );

    if (!code || !state || state !== expectedState) {
        return res.redirect(authRedirect(req, { authMode: "login", authError: "Could not verify the social sign-in request." }));
    }

    try {
        const accessToken = await exchangeCodeForToken(config, String(code));
        const profile = await fetchSocialProfile(config, accessToken);
        const { token, isNewUser } = await loginOrCreateSocialUser(profile);

        res.setHeader("Set-Cookie", [
            cookie.serialize("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            }),
            cookie.serialize(`oauth_state_${provider}`, "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 0,
                path: "/",
            }),
        ]);

        return res.redirect(authRedirect(req, {
            authSuccess: isNewUser
                ? `Thanks for joining Rushes with ${config.label}.`
                : `Thanks for signing in with ${config.label}.`,
            authMode: "login",
        }));
    } catch (error) {
        return res.redirect(authRedirect(req, {
            authMode: "login",
            authError: error.message || "Social sign-in failed.",
        }));
    }
}
