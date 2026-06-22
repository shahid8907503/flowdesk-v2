const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

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
  await EmailVerification.deleteMany({});
});

describe('Authentication Endpoints', () => {
  it('should sign up a new user and generate a verification token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ email: 'john@example.com' });
    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(false);

    const verificationRecord = await EmailVerification.findOne({ userId: user._id });
    expect(verificationRecord).not.toBeNull();
    expect(verificationRecord.token).toBeDefined();
  });

  it('should not allow signup with mismatched passwords', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password321'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should verify email and activate user account', async () => {
    const user = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      isVerified: false
    });

    const token = 'test-token-123';
    await EmailVerification.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60)
    });

    const res = await request(app)
      .get(`/api/auth/verify-email?token=${token}`)
      .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isVerified).toBe(true);
  });

  it('should log in a verified user and return tokens', async () => {
    const user = await User.create({
      name: 'Verify User',
      email: 'verified@example.com',
      password: 'password123',
      isVerified: true
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'verified@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // Refresh Token Cookie
  });

  it('should not log in an unverified user', async () => {
    await User.create({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'password123',
      isVerified: false
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unverified@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
  });
});
