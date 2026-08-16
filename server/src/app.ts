import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import githubRoutes from './routes/github.routes';
import webhookRoutes from './routes/webhook.routes';
import aiRoutes from './routes/ai.routes';
import deploymentRoutes from './routes/deployment.routes';
import alertRoutes from './routes/alert.routes';
import doraRoutes from './routes/dora.routes';
import { env } from './config/env';

const app: Application = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Logging & Body/Cookie Parsing with rawBody preservation for HMAC signature checks
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(cookieParser());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dora', doraRoutes);

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: '🚀 Developer Command Center API Server Active',
    service: 'developer-command-center-api',
    endpoints: {
      health: '/api/health',
      loginWithGitHub: '/api/auth/github',
      me: '/api/auth/me',
      repositories: '/api/github/repositories',
      syncAll: '/api/github/sync/all',
      webhooks: '/api/webhooks/github',
      aiAssistant: '/api/ai/ask',
      deployments: '/api/deployments',
      alerts: '/api/alerts/test',
      dora: '/api/dora',
      activity: '/api/github/activity',
    },
  });
});

// Centralized Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR]: ${err.message}`);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
