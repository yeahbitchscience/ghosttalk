const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const { verifyTokenSocket } = require('./middleware/auth');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Group = require('./models/Group');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghosttalk')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/group', groupRoutes);

// Socket.io for Real-Time Messages
const userSockets = new Map();

io.use(verifyTokenSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id);
  userSockets.set(socket.user.id, socket.id);

  // Join user to all their groups
  Group.find({ members: socket.user.id }).then(groups => {
    groups.forEach(g => socket.join(g._id.toString()));
  }).catch(err => console.error(err));

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', async (data) => {
    const { conversationId, encryptedContent, senderEncryptedContent, receiverId, attachment } = data;
    
    try {
      const msg = new Message({
        conversationId,
        sender: socket.user.id,
        encryptedContent,
        senderEncryptedContent,
        attachment
      });
      await msg.save();
      
      // Update conversation lastMessageAt
      await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });

      const populatedMsg = await msg.populate('sender', 'username');
      
      io.to(conversationId).emit('receive_message', populatedMsg);
      
      // Notify receiver if they are not in the room
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_alert', { conversationId, sender: socket.user.username });
      }
    } catch (err) {
      console.error('Message save error:', err);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('group-message', async (data) => {
    const { groupId, content, attachment } = data;
    try {
      const msg = new Message({
        groupId,
        type: 'group',
        sender: socket.user.id,
        content,
        attachment
      });
      await msg.save();
      const populatedMsg = await msg.populate('sender', 'username');
      io.to(groupId).emit('receive_group_message', populatedMsg);
    } catch (err) {
      console.error('Group Message save error:', err);
      socket.emit('error', 'Failed to send group message');
    }
  });

  socket.on('group-typing', ({ groupId, username }) => {
    socket.to(groupId).emit('group-typing', { groupId, username });
  });

  socket.on('mark_read', async ({ messageId, conversationId }) => {
    await Message.findByIdAndUpdate(messageId, { status: 'read' });
    io.to(conversationId).emit('message_read', { messageId });
  });

  socket.on('disconnect', () => {
    userSockets.delete(socket.user.id);
    console.log('User disconnected:', socket.user.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
