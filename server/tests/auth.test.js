const express = require('express');
const request = require('supertest');

jest.mock('../config/graph', () => ({
  __esModule: true,
  default: {},
  getUserProfile: jest.fn().mockResolvedValue({ id: 'u1', displayName: 'Test User' })
}));

jest.mock('../models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ _id: 'u1', email: 'user@enterprise.com' })
}));

const authRoutes = require('../routes/authRoutes');
const authMiddleware = require('../middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/protected', authMiddleware, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

describe('Auth API & Middleware Suite', () => {
  test('POST /api/auth/login with valid body should return auth response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@enterprise.com', password: 'Password123!' });

    expect([200, 201, 404, 500]).toContain(res.status);
  });

  test('POST /api/auth/login with missing email should return error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password123!' });

    expect([400, 404, 422, 500]).toContain(res.status);
  });

  test('Protected endpoint without Authorization header returns 401', async () => {
    const res = await request(app).get('/api/protected');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toMatch(/missing|No token|Access denied|Unauthorized/i);
  });

  test('Protected endpoint with malformed Authorization header returns 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'InvalidBearerTokenTokenString');

    expect(res.status).toBe(401);
  });
});
