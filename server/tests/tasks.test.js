const express = require('express');
const request = require('supertest');

jest.mock('../services/taskService', () => ({
  getTasks: jest.fn().mockResolvedValue([{ _id: 't1', title: 'Review PR', status: 'pending' }]),
  createTask: jest.fn().mockResolvedValue({ _id: 't1', title: 'Review PR', status: 'pending' }),
  updateTaskStatus: jest.fn().mockResolvedValue({ _id: 't1', status: 'completed' }),
  deleteTask: jest.fn().mockResolvedValue(true)
}));

const taskRoutes = require('../routes/taskRoutes');

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Task API Suite', () => {
  test('GET /api/tasks returns task list', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('POST /api/tasks creates task with valid body', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Review proposal',
        priority: 'High',
        dueDate: new Date().toISOString()
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
  });
});
