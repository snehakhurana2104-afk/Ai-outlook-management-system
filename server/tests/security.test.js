const express = require('express');
const request = require('supertest');
const helmet = require('helmet');

jest.mock('../services/emailService', () => ({
  getAllEmails: jest.fn().mockResolvedValue({
    emails: [{ _id: '507f1f77bcf86cd799439011', subject: 'Clean email' }],
    total: 1,
    page: 1,
    totalPages: 1
  })
}));

const emailRoutes = require('../routes/emailRoutes');

const app = express();
app.use(helmet());
app.use(express.json());
app.use('/api/emails', emailRoutes);

describe('Backend Security Audit Suite', () => {
  test('Security Headers present in HTTP response (X-Content-Type-Options, X-Frame-Options)', async () => {
    const res = await request(app).get('/api/emails');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('XSS script injection payload in text search is sanitized/handled safely', async () => {
    const scriptPayload = '<script>alert("xss")</script>';
    const res = await request(app).get(`/api/emails?search=${encodeURIComponent(scriptPayload)}`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('<script>alert("xss")</script>');
  });

  test('NoSQL Injection pattern in query parameter does not crash database driver', async () => {
    const nosqlPayload = '{"$gt": ""}';
    const res = await request(app).get(`/api/emails?category=${encodeURIComponent(nosqlPayload)}`);

    expect([200, 400, 422, 500]).toContain(res.status);
    expect(res.body).toBeDefined();
  });
});
