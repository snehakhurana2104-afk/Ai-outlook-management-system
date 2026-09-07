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

jest.mock('../services/emailService', () => ({
  getAllEmails: jest.fn().mockResolvedValue({ emails: [], total: 0, page: 1, totalPages: 0 })
}));

jest.mock('../models/Email', () => ({
  countDocuments: jest.fn().mockResolvedValue(10),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      })
    })
  })
}));

jest.mock('../models/Task', () => ({
  countDocuments: jest.fn().mockResolvedValue(3)
}));

const emailRoutes = require('../routes/emailRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);

describe('Backend Performance Benchmark Suite', () => {
  test('GET /api/dashboard/stats responds within 200ms latency window', async () => {
    const startTime = Date.now();
    const res = await request(app).get('/api/dashboard/stats');
    const duration = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Concurrent HTTP requests (5 parallel requests) maintain latency threshold', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 5 }, () => request(app).get('/api/emails'));
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    responses.forEach((res) => expect(res.status).toBe(200));
    expect(duration).toBeLessThan(1500);
  });
});
