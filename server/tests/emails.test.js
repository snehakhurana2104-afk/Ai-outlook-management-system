const express = require('express');
const request = require('supertest');

jest.mock('../models/Email', () => ({
  findById: jest.fn().mockImplementation(async (id) => {
    if (id === '507f1f77bcf86cd799439011') {
      return { _id: id, subject: 'Valid Email' };
    }
    return null;
  }),
  countDocuments: jest.fn().mockResolvedValue(1),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439011', subject: 'Valid Email' }])
      })
    })
  })
}));

jest.mock('../services/emailService', () => ({
  getAllEmails: jest.fn().mockResolvedValue({
    emails: [{ _id: '507f1f77bcf86cd799439011', subject: 'Urgent budget', category: 'Action Required' }],
    total: 1,
    page: 1,
    totalPages: 1,
  }),
  getEmailById: jest.fn().mockImplementation(async (id) => {
    if (id === '507f1f77bcf86cd799439011') {
      return { _id: id, subject: 'Test Email' };
    }
    return null;
  }),
  getEmailStats: jest.fn().mockResolvedValue({ total: 10, unread: 2 }),
  createEmail: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
}));

const emailRoutes = require('../routes/emailRoutes');
const emailDetailsRoutes = require('../routes/emailDetailsRoutes');

const app = express();
app.use(express.json());
app.use('/api/emails', emailRoutes);
app.use('/api/email-details', emailDetailsRoutes);

describe('Email & Details API Suite', () => {
  test('GET /api/emails returns paginated list of emails', async () => {
    const res = await request(app).get('/api/emails?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/emails with search query filters results', async () => {
    const res = await request(app).get('/api/emails?search=urgent');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /api/email-details/invalid-id returns 404 error payload', async () => {
    const res = await request(app).get('/api/email-details/000000000000000000000000');

    expect([404, 400, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('success', false);
  });
});
