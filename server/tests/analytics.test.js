const express = require('express');
const request = require('supertest');

jest.mock('../models/Email', () => ({
  aggregate: jest.fn().mockResolvedValue([
    { _id: 'Action Required', count: 5 },
    { _id: 'High Priority', count: 3 }
  ]),
  countDocuments: jest.fn().mockResolvedValue(10)
}));

const analyticsRoutes = require('../routes/analyticsRoutes');

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics API Suite', () => {
  test('GET /api/analytics/overview returns analytics summary', async () => {
    const res = await request(app).get('/api/analytics/overview');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /api/analytics/sentiment returns sentiment distribution', async () => {
    const res = await request(app).get('/api/analytics/sentiment');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
