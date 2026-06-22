const express = require('express');
const {
  signup,
  login,
  verify2fa,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enable2fa,
  disable2fa,
  refresh,
  logout,
  getSessions,
  revokeSession
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/verify-2fa', authLimiter, verify2fa);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.post('/enable-2fa', protect, enable2fa);
router.post('/disable-2fa', protect, disable2fa);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

// Device sessions
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);

module.exports = router;
