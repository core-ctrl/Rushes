import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { fetchDetails, fetchTrendingMovies, fetchTrendingTV, fetchWatchProviders } from "@/lib/tmdb";
import { buildUserProfile } from "@/services/recommendationService";
import { getContentStatus, getTitle, getWatchProviders, withDecisionMetadata } from "@/lib/decisionEngine";
import { sendDecisionAlertEmail } from "@/lib/mailer";

function isAuthorized(req) {
  const secret = process.env.NOTIFICATION_JOB_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.authorization === `Bearer ${secret}` || req.query.secret === secret;
}

function sameProviders(a = [], b = []) {
  return a.join("|") === b.join("|");
}

function buildMessage(type, item, providers, user) {
  const title = getTitle(item);
  const providerText = providers.length ? ` on ${providers.slice(0, 2).join(", ")}` : "";
  const language = item.original_language ? item.original_language.toUpperCase() : "your language";
  const genres = user.preferredGenres?.length ? "genre" : "movie";

  if (type === "watchlist") return `A movie from your watchlist is now available to watch${providerText}: ${title}`;
  if (type === "theater_to_ott") return `This movie just moved from theaters to OTT${providerText}: ${title}`;
  if (type === "trend_spike") return `This movie is trending right now and matches your profile: ${title}`;
  return `New ${language} ${genres} dropped on OTT and matches your taste${providerText}: ${title}`;
}

async function pushNotification(user, payload) {
  const existingRecent = (user.notificationInbox || []).some(
    (item) =>
      item.type === payload.type &&
      item.mediaId === payload.mediaId &&
      Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  if (existingRecent) return false;

  user.notificationInbox.unshift({
    ...payload,
    read: false,
    createdAt: new Date(),
  });
  user.notificationInbox = user.notificationInbox.slice(0, 50);

  if (user.notificationSettings?.email !== false) {
    await sendDecisionAlertEmail(user.email, user.name, payload.message, "Rushes alert");
  }

  return true;
}

async function inspectItem(item, mediaType, region) {
  const [details, providers] = await Promise.all([
    fetchDetails(item.mediaId || item.id, mediaType),
    fetchWatchProviders(item.mediaId || item.id, mediaType, region),
  ]);
  const merged = withDecisionMetadata({
    ...details,
    id: item.mediaId || item.id,
    media_type: mediaType,
    title: details.title || item.title,
    name: details.name || item.title,
    availability: providers,
  });
  const providerNames = getWatchProviders(providers).map((provider) => provider.provider_name);
  return { item: merged, providers, providerNames, status: getContentStatus(merged, providers) };
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    await connectDB();
    const users = await User.find({
      $or: [{ wishlist: { $exists: true, $ne: [] } }, { preferredGenres: { $exists: true, $ne: [] } }],
    }).select(
      "name email wishlist preferredGenres preferredLanguages preferredRegions watchHistory notificationInbox availabilitySnapshots notificationSettings"
    ).limit(200);

    const [trendingMovies, trendingTV] = await Promise.all([fetchTrendingMovies(), fetchTrendingTV()]);
    let created = 0;

    for (const user of users) {
      const region = user.preferredRegions?.[0] || "IN";
      const profile = buildUserProfile(user);
      const snapshotByKey = new Map(
        (user.availabilitySnapshots || []).map((snapshot) => [`${snapshot.mediaType}:${snapshot.mediaId}`, snapshot])
      );

      for (const watchItem of (user.wishlist || []).slice(0, 20)) {
        const mediaType = watchItem.mediaType || "movie";
        const { item, providerNames, status } = await inspectItem(watchItem, mediaType, region);
        const snapshotKey = `${mediaType}:${watchItem.mediaId}`;
        const previous = snapshotByKey.get(snapshotKey);

        if (status.key === "ott" && providerNames.length) {
          const type = previous?.statusKey === "theaters" ? "theater_to_ott" : "watchlist";
          const wasAlreadyOtt = previous?.statusKey === "ott" && sameProviders(previous.providerNames, providerNames);
          if (!wasAlreadyOtt) {
            const didCreate = await pushNotification(user, {
              type,
              mediaId: watchItem.mediaId,
              mediaType,
              title: getTitle(item),
              message: buildMessage(type, item, providerNames, user),
              providerNames,
            });
            if (didCreate) created += 1;
          }
        }

        user.availabilitySnapshots = (user.availabilitySnapshots || []).filter(
          (snapshot) => !(snapshot.mediaId === watchItem.mediaId && snapshot.mediaType === mediaType)
        );
        user.availabilitySnapshots.push({
          mediaId: watchItem.mediaId,
          mediaType,
          statusKey: status.key,
          providerNames,
          checkedAt: new Date(),
        });
      }

      const tastePool = [...trendingMovies.slice(0, 10), ...trendingTV.slice(0, 10)];
      for (const rawItem of tastePool.slice(0, 8)) {
        const mediaType = rawItem.media_type || (rawItem.title ? "movie" : "tv");
        const genreIds = rawItem.genre_ids || [];
        const genreMatch = profile.preferredGenres?.some((genre) => genreIds.includes(genre));
        const languageMatch = profile.preferredLanguages?.includes(rawItem.original_language);
        if (!genreMatch && !languageMatch) continue;

        const providers = await fetchWatchProviders(rawItem.id, mediaType, region);
        const providerNames = getWatchProviders(providers).map((provider) => provider.provider_name);
        if (!providerNames.length) continue;

        const didCreate = await pushNotification(user, {
          type: rawItem.popularity >= 120 ? "trend_spike" : "taste",
          mediaId: rawItem.id,
          mediaType,
          title: getTitle(rawItem),
          message: buildMessage(rawItem.popularity >= 120 ? "trend_spike" : "taste", rawItem, providerNames, user),
          providerNames,
        });
        if (didCreate) created += 1;
      }

      user.availabilitySnapshots = (user.availabilitySnapshots || []).slice(-100);
      await user.save();
    }

    return res.status(200).json({ users: users.length, notificationsCreated: created });
  } catch (err) {
    console.error("NOTIFICATION_JOB_ERROR:", err);
    return res.status(500).json({ error: "Notification job failed" });
  }
}
