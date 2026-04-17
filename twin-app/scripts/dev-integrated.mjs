import http from 'node:http';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import {
  createIntegratedExpressApp,
  findAvailablePort,
  getIntegratedAppPort,
  rootDir,
} from './signflow-runtime.mjs';

const requestedPort = getIntegratedAppPort(5173);
const port = await findAvailablePort(requestedPort);
const appBaseUrl = `http://localhost:${port}`;
const app = createIntegratedExpressApp({ appBaseUrl, nodeEnv: 'development' });
const httpServer = http.createServer(app);

const vite = await createViteServer({
  configFile: false,
  root: rootDir,
  appType: 'spa',
  plugins: [react()],
  resolve: {
    alias: {
      routes: fileURLToPath(new URL('../src/horizon/routes.jsx', import.meta.url)),
      'routes.js': fileURLToPath(new URL('../src/horizon/routes.jsx', import.meta.url)),
      'routes.jsx': fileURLToPath(new URL('../src/horizon/routes.jsx', import.meta.url)),
      assets: fileURLToPath(new URL('../src/horizon/assets', import.meta.url)),
      components: fileURLToPath(new URL('../src/horizon/components', import.meta.url)),
      contexts: fileURLToPath(new URL('../src/horizon/contexts', import.meta.url)),
      layouts: fileURLToPath(new URL('../src/horizon/layouts', import.meta.url)),
      theme: fileURLToPath(new URL('../src/horizon/theme', import.meta.url)),
      variables: fileURLToPath(new URL('../src/horizon/variables', import.meta.url)),
      views: fileURLToPath(new URL('../src/horizon/views', import.meta.url)),
    },
  },
  server: {
    middlewareMode: true,
    hmr: { server: httpServer },
  },
});

app.use(vite.middlewares);

httpServer.listen(port, () => {
  if (port !== requestedPort) {
    console.log(`Requested port ${requestedPort} was busy, using ${port} instead.`);
  }
  console.log(`\nIntegrated ICU + SignFlow dev server running at ${appBaseUrl}`);
  console.log(`SignFlow API: ${appBaseUrl}/signflow/api/health`);
});

const shutdown = async (signal) => {
  console.log(`\nStopping integrated dev server (${signal})...`);
  await vite.close();
  httpServer.close(() => process.exit(0));
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
