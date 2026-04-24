const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');

router.use(verifyToken);

// Create a group
router.post('/create', async (req, res) => {
  try {
    const { name, type, members } = req.body;
    let memberIds = [req.userId];
    if (members && Array.isArray(members)) {
      memberIds = [...new Set([...memberIds, ...members])];
    }
    const group = new Group({
      name,
      type: type || 'private',
      createdBy: req.userId,
      admins: [req.userId],
      members: memberIds,
      inviteCode: crypto.randomBytes(5).toString('hex'),
      inviteEnabled: true
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member
router.post('/add-member', async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ error: 'Not an admin' });
    
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group messages
router.get('/:id/messages', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.userId)) return res.status(403).json({ error: 'Not a member' });

    const messages = await Message.find({ groupId: group._id, type: 'group' })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group info
router.get('/:id/info', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members admins', 'username');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Only return invite code if admin
    let groupData = group.toObject();
    if (!group.admins.find(a => a._id.toString() === req.userId)) {
      delete groupData.inviteCode;
    }
    res.json(groupData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change visibility
router.patch('/:id/visibility', async (req, res) => {
  try {
    const { type } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ error: 'Not an admin' });

    group.type = type;
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate invite
router.post('/:id/invite/generate', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ error: 'Not an admin' });

    group.inviteCode = crypto.randomBytes(5).toString('hex');
    group.inviteEnabled = true;
    await group.save();
    res.json({ inviteCode: group.inviteCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke invite
router.delete('/:id/invite/revoke', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ error: 'Not an admin' });

    group.inviteEnabled = false;
    group.inviteCode = null;
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join via invite
router.get('/join/:inviteCode', async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode, inviteEnabled: true });
    if (!group) return res.status(404).json({ error: 'Invalid or expired invite code' });

    if (!group.members.includes(req.userId)) {
      group.members.push(req.userId);
      await group.save();
    }
    res.json({ success: true, groupId: group._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's groups
router.get('/user/all', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId }).sort({ updatedAt: -1 });
    
    // fetch last message for each
    const groupsWithLastMessage = await Promise.all(groups.map(async (g) => {
      const lastMessage = await Message.findOne({ groupId: g._id, type: 'group' }).sort({ createdAt: -1 });
      return { ...g.toObject(), lastMessage };
    }));
    
    res.json(groupsWithLastMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search public groups
router.get('/search/public', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    const groups = await Group.find({ type: 'public', name: { $regex: String(query), $options: 'i' } }).select('name members type');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
