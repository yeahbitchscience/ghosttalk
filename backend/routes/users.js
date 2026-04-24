const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/search', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);

    const currentUser = await User.findById(req.userId);

    const users = await User.find({
      username: { $regex: String(username), $options: 'i' },
      privacySetting: { $ne: 'Ghost' },
      _id: { $ne: req.userId, $nin: currentUser.blockedUsers },
      blockedUsers: { $ne: req.userId }
    }).select('username publicKey privacySetting');

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.post('/block/:targetId', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { blockedUsers: req.params.targetId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock/:targetId', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { blockedUsers: req.params.targetId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.get('/blocked', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', 'username');
    res.json(user.blockedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

router.put('/privacy', async (req, res) => {
  try {
    const { privacySetting } = req.body;
    if (!['Open', 'Restricted', 'Ghost'].includes(privacySetting)) {
      return res.status(400).json({ error: 'Invalid setting' });
    }

    const user = await User.findByIdAndUpdate(req.userId, { privacySetting }, { new: true });
    res.json({ privacySetting: user.privacySetting });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username privacySetting totpEnabled');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

module.exports = router;
