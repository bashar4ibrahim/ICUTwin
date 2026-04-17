import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, '..');
export const signflowDir = path.join(rootDir, 'server', 'signflow-backend');
export const distDir = path.join(rootDir, 'dist');

const signflowRequire = createRequire(pathToFileURL(path.join(signflowDir, 'package.json')).href);

const express = signflowRequire('express');
const cors = signflowRequire('cors');
const dotenv = signflowRequire('dotenv');
const helmet = signflowRequire('helmet');
const morgan = signflowRequire('morgan');
const authRoutes = signflowRequire(path.join(signflowDir, 'src/routes/auth.js'));
const documentRoutes = signflowRequire(path.join(signflowDir, 'src/routes/documents.js'));
const { getEmailLogs } = signflowRequire(path.join(signflowDir, 'src/services/emailLog.js'));

export const signflowExpress = express;

export const getIntegratedAppPort = (defaultPort = 5173) =>
  Number(process.env.APP_PORT || process.env.VITE_PORT || defaultPort);

export async function findAvailablePort(startPort = 5173, attempts = 20) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = startPort + offset;
    const available = await new Promise((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, '0.0.0.0');
    });

    if (available) {
      return port;
    }
  }

  throw new Error(`No open port found starting at ${startPort}.`);
}

const isAllowedDevOrigin = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

export function createIntegratedExpressApp({ appBaseUrl, nodeEnv = 'development' } = {}) {
  dotenv.config({ path: path.join(signflowDir, '.env') });

  process.env.NODE_ENV = process.env.NODE_ENV || nodeEnv;
  process.env.APP_BASE_URL =
    appBaseUrl || process.env.APP_BASE_URL || `http://localhost:${getIntegratedAppPort()}`;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-signflow-jwt-secret';
  process.env.INVITE_TOKEN_SECRET =
    process.env.INVITE_TOKEN_SECRET || 'dev-signflow-invite-secret';

  const uploadsDir = path.join(signflowDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === process.env.APP_BASE_URL || isAllowedDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by SignFlow dev runtime.'));
    },
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/signflow/uploads', express.static(uploadsDir));
  app.use('/signflow/api/auth', authRoutes);
  app.use('/signflow/api/documents', documentRoutes);

  app.get('/signflow/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'signflow',
      env: process.env.NODE_ENV,
      appBaseUrl: process.env.APP_BASE_URL,
      time: new Date().toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    app.get('/signflow/api/dev/emails', (req, res) => {
      res.json({ emails: getEmailLogs() });
    });
  }

  return app;
}
