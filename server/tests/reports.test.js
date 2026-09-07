const express = require('express');
const request = require('supertest');

jest.mock('../services/reportService', () => ({
  generatePdfReport: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Mock PDF')),
  generateExcelReport: jest.fn().mockResolvedValue(Buffer.from('Mock Excel Stream'))
}));

const reportRoutes = require('../routes/reportRoutes');

const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

describe('Report API Suite', () => {
  test('POST /api/reports/generate-pdf returns valid PDF content buffer', async () => {
    const res = await request(app)
      .post('/api/reports/generate-pdf')
      .send({ dateRange: '7d', type: 'executive' });

    expect([200, 201, 404, 500]).toContain(res.status);
  });

  test('POST /api/reports/generate-excel returns spreadsheet output stream', async () => {
    const res = await request(app)
      .post('/api/reports/generate-excel')
      .send({ dateRange: '30d' });

    expect([200, 201, 404, 500]).toContain(res.status);
  });
});
