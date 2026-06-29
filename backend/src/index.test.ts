import request from 'supertest';
import app from './index';

// Mock Prisma Client to prevent connection failures during test runs
jest.mock('./config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

describe('Sanity & Health Check Endpoint', () => {
  it('should return 200 OK and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toEqual(404);
  });
});
