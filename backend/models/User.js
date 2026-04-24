const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  totpSecret: { type: String },
  totpEnabled: { type: Boolean, default: false },
  recoveryTokenHash: { type: String, required: true }, // The only recovery method
  privacySetting: { type: String, enum: ['Open', 'Restricted', 'Ghost'], default: 'Open' },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  publicKey: { type: String, required: true }, // RSA Public Key for E2E
  encryptedPrivateKey: { type: Object, required: true }, // AES-encrypted RSA Private Key
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
