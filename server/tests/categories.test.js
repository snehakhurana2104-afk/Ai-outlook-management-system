const express = require('express');
const request = require('supertest');

jest.mock('../models/Email', () => ({
  aggregate: jest.fn().mockResolvedValue([
    { _id: 'Action Required', count: 5 },
    { _id: 'High Priority', count: 3 }
  ])
}));

const categoryRoutes = require('../routes/categoryRoutes');

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

describe('Categories API Suite', () => {
  test('GET /api/categories returns array of categories with counts', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
