const { connectDB } = require("../lib/mongodb");
const User = require("../models/User");

async function getWatchlist(userId) {
  await connectDB();
  const user = await User.findById(userId).select("wishlist");
  return user?.wishlist || [];
}

async function addToWatchlist(userId, { mediaId, mediaType, title, posterPath }) {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $addToSet: { wishlist: { mediaId, mediaType, title, posterPath, addedAt: new Date() } },
  });
}

async function removeFromWatchlist(userId, mediaId, mediaType) {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $pull: { wishlist: { mediaId: Number(mediaId), mediaType } },
  });
}

async function addToHistory(userId, { mediaId, mediaType, title, posterPath }) {
  await connectDB();
  await User.findByIdAndUpdate(userId, {
    $push: {
      watchHistory: {
        $each: [{ mediaId, mediaType, title, posterPath, watchedAt: new Date() }],
        $position: 0,
        $slice: 50,
      },
    },
  });
}

async function getHistory(userId) {
  await connectDB();
  const user = await User.findById(userId).select("watchHistory");
  return user?.watchHistory || [];
}

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  addToHistory,
  getHistory
};
