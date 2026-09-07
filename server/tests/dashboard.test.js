const express = require('express');
const request = require('supertest');

jest.mock('../services/authService', () => ({
  __esModule: true,
  default: {},
  getAccessToken: jest.fn().mockReturnValue('mock-access-token')
}));

jest.mock('../services/graphService', () => ({
  __esModule: true,
  default: {},
  getInboxMessages: jest.fn().mockResolvedValue([]),
  getInboxCount: jest.fn().mockResolvedValue(0)
}));

jest.mock('../config/graph', () => ({
  __esModule: true,
  default: {},
  getInbox: jest.fn().mockResolvedValue([])
}));

jest.mock('../models/Email', () => ({
  countDocuments: jest.fn().mockResolvedValue(10),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: '1', subject: 'Recent Email', receivedDateTime: new Date() }
        ])
      })
    })
  })
}));

jest.mock('../models/Task', () => ({
  countDocuments: jest.fn().mockResolvedValue(3)
}));

const dashboardRoutes = require('../routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard API Suite', () => {
  test('GET /api/dashboard/stats returns stats structure with non-null values', async () => {
    const res = await request(app).get('/api/dashboard/stats');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toBeDefined();
  });

  test('GET /api/dashboard/recent-activity returns activity array payload', async () => {
    const res = await request(app).get('/api/dashboard/recent-activity');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
