const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const RefreshToken = require('../models/RefreshToken');
const DeviceDetector = require('device-detector-js');
const DeviceSession = require('../models/DeviceSession');
const { sendEmail } = require('../config/mailer');
const { logAction } = require('../services/auditService');
const { signupSchema, loginSchema, verifyOtpSchema } = require('../utils/validators');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_123';

const recordDeviceSession = async (userId, refreshToken, req) => {
  try {
    const deviceDetector = new DeviceDetector();
    const userAgent = req.headers['user-agent'] || '';
    const parsed = deviceDetector.parse(userAgent);
    
    const deviceTypeRaw = parsed.device && parsed.device.type ? parsed.device.type : 'desktop';
    const deviceType = deviceTypeRaw.charAt(0).toUpperCase() + deviceTypeRaw.slice(1);
    
    const browser = parsed.client && parsed.client.name ? parsed.client.name : 'Unknown';
    const os = parsed.os && parsed.os.name ? parsed.os.name : 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    
    await DeviceSession.create({
      userId,
      ipAddress,
      deviceType,
      browser,
      os,
      userAgent,
      refreshToken,
      isActive: true
    });
  } catch (error) {
    console.error('Error recording device session:', error);
  }
};

const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token in db
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, token: refreshToken, expiresAt });

  return { accessToken, refreshToken };
};

const signup = async (req, res, next) => {
  try {
    const parsedData = signupSchema.parse(req.body);
    const { name, email, password } = parsedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await EmailVerification.create({ userId: user._id, token, expiresAt });

    // Send verification email
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://flowdesk-v2-omega.vercel.app' : 'http://localhost:5173');
    const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your FlowDesk Account',
        html: `
          <h2>Welcome to FlowDesk!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>This link expires in 24 hours.</p>
        `
      });
    } catch (mailError) {
      logger.warn(`Failed to send verification email to ${user.email} (link logged in console): ${mailError.message}`);
    }

    await logAction(user._id, 'auth.signup', req, { email: user.email });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const parsedData = loginSchema.parse(req.body);
    const { email, password } = parsedData;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Generate OTP and send email
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
      user.twoFactorSecret = crypto.createHash('sha256').update(otp).digest('hex'); // Temporarily store OTP hash in twoFactorSecret
      await user.save();

      // Send 2FA email
      try {
        await sendEmail({
          to: user.email,
          subject: 'FlowDesk - Two-Factor Authentication OTP',
          html: `
            <h2>Security Verification</h2>
            <p>You have two-factor authentication enabled. Please use the following One-Time Password (OTP) to complete your login:</p>
            <div style="font-size: 32px; font-weight: bold; background-color: #1e1e24; padding: 15px; text-align: center; border-radius: 8px; color: #818cf8; letter-spacing: 5px;">${otp}</div>
            <p>This OTP is valid for 10 minutes.</p>
          `
        });
      } catch (mailError) {
        logger.warn(`Failed to send 2FA OTP email to ${user.email} (OTP logged in console): ${mailError.message}`);
      }

      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        email: user.email,
        message: 'Two-factor OTP sent to your email.'
      });
    }

    // General login success
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Set HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await recordDeviceSession(user._id, refreshToken, req);

    await logAction(user._id, 'auth.login', req);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
};

const verify2fa = async (req, res, next) => {
  try {
    const parsedData = verifyOtpSchema.parse(req.body);
    const { email, otp } = parsedData;

    const user = await User.findOne({ email });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA request' });
    }

    // Verify OTP hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.twoFactorSecret !== otpHash) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // Clear temp OTP hash
    user.twoFactorSecret = undefined;
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await recordDeviceSession(user._id, refreshToken, req);

    await logAction(user._id, 'auth.login.2fa', req);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const verificationRecord = await EmailVerification.findOne({ token });
    if (!verificationRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(verificationRecord.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    await EmailVerification.deleteOne({ _id: verificationRecord._id });
    await logAction(user._id, 'auth.verify_email', req);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak whether a user exists
      return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Delete any existing password reset requests for this user to avoid duplicate key errors
    await PasswordReset.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await PasswordReset.create({ userId: user._id, token, expiresAt });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://flowdesk-v2-omega.vercel.app' : 'http://localhost:5173');
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'FlowDesk - Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If you didn't request this, you can ignore this email. This link expires in 1 hour.</p>
        `
      });
    } catch (mailError) {
      logger.warn(`Failed to send password reset email to ${user.email} (link logged in console): ${mailError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const resetRecord = await PasswordReset.findOne({ token });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.password = password; // Pre-save hook hashes it automatically
    await user.save();

    await PasswordReset.deleteOne({ _id: resetRecord._id });
    await logAction(user._id, 'auth.reset_password', req);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

const enable2fa = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = true;
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 5; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex')); // 8 chars code
    }
    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    await logAction(user._id, 'auth.enable_2fa', req);

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully.',
      backupCodes
    });
  } catch (error) {
    next(error);
  }
};

const disable2fa = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = false;
    user.twoFactorBackupCodes = [];
    await user.save();

    await logAction(user._id, 'auth.disable_2fa', req);

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled.'
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    // Verify token validity
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
    }

    // Check if token exists in DB (for reuse detection/revocation)
    const tokenRecord = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenRecord) {
      // Potential malicious reuse! Delete all active refresh tokens for the user as precaution.
      await RefreshToken.deleteMany({ userId: decoded.userId });
      // Also flag all active device sessions for this user as inactive
      await DeviceSession.updateMany({ userId: decoded.userId }, { isActive: false });
      return res.status(401).json({ success: false, message: 'Invalid token reuse detected' });
    }

    // Delete used refresh token (rotation)
    await RefreshToken.deleteOne({ _id: tokenRecord._id });

    // Generate new access and refresh tokens
    const tokens = await generateTokens(decoded.userId);

    // Update the existing device session with the new refresh token and last active time
    await DeviceSession.updateOne(
      { refreshToken },
      { 
        refreshToken: tokens.refreshToken,
        lastActive: Date.now()
      }
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
      // Invalidate active device session for this refresh token
      await DeviceSession.updateOne({ refreshToken }, { isActive: false });
    }
    
    res.clearCookie('refreshToken');
    if (req.user) {
      await logAction(req.user._id, 'auth.logout', req);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await DeviceSession.find({ userId: req.user._id, isActive: true }).sort({ lastActive: -1 });
    
    // Enrich with a flag indicating if it is the current session
    const currentRefreshToken = req.cookies.refreshToken;
    const enrichedSessions = sessions.map(session => {
      const sessionObj = session.toObject();
      sessionObj.isCurrent = session.refreshToken === currentRefreshToken;
      // Strip refresh token from output for security
      delete sessionObj.refreshToken;
      return sessionObj;
    });

    res.status(200).json({
      success: true,
      sessions: enrichedSessions
    });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await DeviceSession.findOne({ _id: id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    if (session.refreshToken) {
      await RefreshToken.deleteOne({ token: session.refreshToken });
    }

    await logAction(req.user._id, 'auth.session.revoke', req, { sessionId: id, device: `${session.browser} on ${session.os}` });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
