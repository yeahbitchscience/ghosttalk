const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/logs', async (req, res) => {
  // In a real app, verify admin role here
  // if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const suspiciousUsers = await User.find({ failedLoginAttempts: { $gt: 0 } })
      .select('username failedLoginAttempts lockoutUntil')
      .sort({ failedLoginAttempts: -1 });
    
    // Simulate breach alerts (e.g., users locked out)
    const breachAlerts = suspiciousUsers.filter(u => u.lockoutUntil && u.lockoutUntil > new Date());

    res.json({
      suspiciousLogins: suspiciousUsers,
      breachAlerts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
