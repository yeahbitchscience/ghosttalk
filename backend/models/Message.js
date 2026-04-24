const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ['dm', 'group'], default: 'dm' },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String }, // Plaintext for group messages
  encryptedContent: { type: String }, // Server only stores ciphertext for receiver (DM)
  senderEncryptedContent: { type: String }, // Ciphertext for sender (DM)
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  attachment: {
    filename: String,
    mimeType: String,
    size: Number,
    url: String,
    encryptedKey: String // Key to decrypt the file
  },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// TTL index to automatically delete messages permanently 30 days after deletion
messageSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { deletedAt: { $type: "date" } } });

module.exports = mongoose.model('Message', messageSchema);
