const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['public', 'private'], default: 'private' },
  inviteCode: { type: String },
  inviteEnabled: { type: Boolean, default: false },
  inviteExpiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
