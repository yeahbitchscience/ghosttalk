const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const NodeClam = require('clamscan');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

let clamscan;
new NodeClam().init({
  clamdscan: { host: '127.0.0.1', port: 3310, active: true },
  preference: 'clamdscan'
}).then(instance => {
  clamscan = instance;
}).catch(err => {
  console.log('ClamAV not running, virus scanning disabled');
});

// Get all conversations for inbox
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate('participants', 'username publicKey')
      .sort({ lastMessageAt: -1 });

    const result = await Promise.all(conversations.map(async (conv) => {
      const lastMessage = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .limit(1);
      
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: req.userId },
        status: { $ne: 'read' }
      });

      return { ...conv.toObject(), lastMessage, unreadCount };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    let conv = await Conversation.findOne({
      participants: { $all: [req.userId, targetUserId] }
    }).populate('participants', 'username publicKey');

    if (!conv) {
      conv = new Conversation({ participants: [req.userId, targetUserId] });
      await conv.save();
      conv = await conv.populate('participants', 'username publicKey');
    }

    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.conversationId,
      deletedFor: { $ne: req.userId } 
    }).populate('sender', 'username').sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Not found' });

    // Mark as deleted for both sides since prompt said "from both sides"
    message.deletedFor = [req.userId, message.sender.toString() === req.userId ? message.conversationId.participants?.find(p=>p.toString()!==req.userId) : req.userId];
    message.deletedAt = new Date();
    message.encryptedContent = ''; // clear content immediately
    await message.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (clamscan) {
      const { isInfected } = await clamscan.isInfected(req.file.path);
      if (isInfected) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File infected with virus' });
      }
    }

    res.json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
