import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import queryRoutes from './routes/query.routes.js';
import repoRoutes from './routes/repo.routes.js';
import etlRoutes from './routes/etl.routes.js';
import statsRoutes from './routes/stats.routes.js';
import authRoutes from './routes/auth.routes.js';
import localizationRoutes from './routes/localization.routes.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/localization', localizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/queries', requireAuth, queryRoutes);
app.use('/api/repos', requireAuth, repoRoutes);
app.use('/api/etl', requireAuth, etlRoutes);
app.use('/api', requireAuth, statsRoutes);

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
