const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      notifications: notifications.map(n => ({
        ...n,
        id: n._id.toString()
      }))
    });
  } catch (err) {
    console.error('Notifications GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notifications
// Marks notifications as read
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId }, { $set: { read: true } });
    } else {
      await Notification.updateMany({ userId }, { $set: { read: true } });
      await User.findByIdAndUpdate(userId, {
        $set: { "notificationInbox.$[].read": true }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Notifications POST error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications (fallback for PUT requests)
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ userId }, { $set: { read: true } });
    await User.findByIdAndUpdate(userId, {
      $set: { "notificationInbox.$[].read": true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Notifications PUT error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/notifications
// Clears notifications
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body || req.query;

    if (notificationId) {
      await Notification.deleteOne({ _id: notificationId, userId });
    } else {
      await Notification.deleteMany({ userId });
      await User.findByIdAndUpdate(userId, { $set: { notificationInbox: [] } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Notifications DELETE error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
