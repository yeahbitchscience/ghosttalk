const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const User = require('../models/User');
const { loginLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password, publicKey, encryptedPrivateKey } = req.body;
    
    if (!username || !password || !publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const recoveryTokenHash = await bcrypt.hash(recoveryToken, 10);

    const user = new User({
      username,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
      recoveryTokenHash
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      recoveryToken // Return once for the client to encrypt and download
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, totpToken } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({ error: 'Account locked. Try again later.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.totpEnabled) {
      if (!totpToken) {
        return res.status(401).json({ error: 'TOTP token required', requiresTotp: true });
      }
      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: totpToken,
        window: 1
      });
      if (!verified) {
        return res.status(401).json({ error: 'Invalid TOTP token' });
      }
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        privacySetting: user.privacySetting,
        totpEnabled: user.totpEnabled
      },
      encryptedPrivateKey: user.encryptedPrivateKey
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recover', async (req, res) => {
  try {
    const { username, recoveryToken, newPassword } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(recoveryToken, user.recoveryTokenHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid recovery token' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    
    // Optional: cycle recovery token
    const newRecoveryToken = crypto.randomBytes(32).toString('hex');
    user.recoveryTokenHash = await bcrypt.hash(newRecoveryToken, 10);
    
    await user.save();

    res.json({ message: 'Password reset successfully', newRecoveryToken });
  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/setup-2fa', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if(!token) return res.status(401).send();
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const secret = speakeasy.generateSecret({ name: 'GhostTalk' });
    
    await User.findByIdAndUpdate(decoded.id, { totpSecret: secret.base32 });
    
    res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url });
  } catch (err) {
    res.status(500).json({ error: 'Error setting up 2FA' });
  }
});

router.post('/verify-2fa', async (req, res) => {
  const tokenHeader = req.headers['authorization']?.split(' ')[1];
  if(!tokenHeader) return res.status(401).send();

  try {
    const decoded = jwt.verify(tokenHeader, process.env.JWT_SECRET || 'fallback_secret');
    const { token } = req.body;
    
    const user = await User.findById(decoded.id);
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (verified) {
      user.totpEnabled = true;
      await user.save();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error verifying 2FA' });
  }
});

module.exports = router;
