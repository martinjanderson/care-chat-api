import request from 'supertest';
import express, { Express } from 'express';

const app: Express = express();

app.get('/healthcheck', (req, res) => {
  res.sendStatus(200);
});

describe('Healthcheck Endpoint', () => {
  it('should return a 200 status code', async () => {
    const response = await request(app).get('/healthcheck');
    expect(response.status).toBe(200);
  });
});
