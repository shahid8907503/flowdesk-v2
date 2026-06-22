const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const DeviceSession = require('../models/DeviceSession');

const TEST_MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/flowdesk_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
  await DeviceSession.deleteMany({});
});

describe('Device Session Tracking & Invalidation', () => {
  it('should create a device session upon successful login', async () => {
    const user = await User.create({
      name: 'Session Tester',
      email: 'tester@example.com',
      password: 'password123',
      isVerified: true
    });

    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      .send({
        email: 'tester@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);

    const session = await DeviceSession.findOne({ userId: user._id });
    expect(session).not.toBeNull();
    expect(session.browser).toEqual('Chrome');
    expect(session.os).toEqual('Windows');
    expect(session.deviceType).toEqual('Desktop');
    expect(session.isActive).toBe(true);
  });

  it('should list active sessions and flag the current session', async () => {
    const user = await User.create({
      name: 'Session Lister',
      email: 'lister@example.com',
      password: 'password123',
      isVerified: true
    });

    // Log in to create a session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')
      .send({
        email: 'lister@example.com',
        password: 'password123'
      });

    const token = loginRes.body.accessToken;
    const cookieHeader = loginRes.headers['set-cookie'];

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookieHeader)
      .send();

    expect(sessionsRes.statusCode).toEqual(200);
    expect(sessionsRes.body.success).toBe(true);
    expect(sessionsRes.body.sessions.length).toEqual(1);
    expect(sessionsRes.body.sessions[0].browser).toEqual('Mobile Safari');
    expect(sessionsRes.body.sessions[0].deviceType).toEqual('Smartphone');
    expect(sessionsRes.body.sessions[0].isCurrent).toBe(true);
  });

  it('should revoke a session, setting it inactive and deleting the refresh token', async () => {
    const user = await User.create({
      name: 'Session Revoker',
      email: 'revoker@example.com',
      password: 'password123',
      isVerified: true
    });

    // 1. Log in to create current session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      .send({
        email: 'revoker@example.com',
        password: 'password123'
      });

    const token = loginRes.body.accessToken;

    // 2. Create another fake session for the same user (e.g. from mobile)
    const mobileSession = await DeviceSession.create({
      userId: user._id,
      ipAddress: '192.168.1.100',
      deviceType: 'Mobile',
      browser: 'Safari',
      os: 'iOS',
      userAgent: 'Mock iOS agent',
      refreshToken: 'fake_refresh_token_xyz',
      isActive: true
    });

    // Create the token in RefreshToken collection too
    await RefreshToken.create({
      userId: user._id,
      token: 'fake_refresh_token_xyz',
      expiresAt: new Date(Date.now() + 1000 * 60)
    });

    // 3. Revoke the mobile session
    const revokeRes = await request(app)
      .delete(`/api/auth/sessions/${mobileSession._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(revokeRes.statusCode).toEqual(200);
    expect(revokeRes.body.success).toBe(true);

    // Verify it is flagged inactive in database
    const updatedMobileSession = await DeviceSession.findById(mobileSession._id);
    expect(updatedMobileSession.isActive).toBe(false);

    // Verify corresponding refresh token is deleted
    const dbRefreshToken = await RefreshToken.findOne({ token: 'fake_refresh_token_xyz' });
    expect(dbRefreshToken).toBeNull();
  });
});
