import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';
import { env } from '../config/env';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const databaseStatus = await getDatabaseStatus();
  const memoryUsage = process.memoryUsage();

  const overallStatus = databaseStatus === 'connected' ? 'healthy' : 'degraded';
  const statusCode = databaseStatus === 'connected' || databaseStatus === 'not_configured' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    service: 'developer-command-center-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: parseFloat(process.uptime().toFixed(2)),
    database: {
      status: databaseStatus,
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
    },
    environment: env.NODE_ENV,
  });
});

export default router;
