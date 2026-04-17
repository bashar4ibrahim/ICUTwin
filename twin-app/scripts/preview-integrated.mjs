import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  createIntegratedExpressApp,
  distDir,
  findAvailablePort,
  getIntegratedAppPort,
  signflowExpress,
} from './signflow-runtime.mjs';

const requestedPort = getIntegratedAppPort(4173);
const port = await findAvailablePort(requestedPort);
const appBaseUrl = `http://localhost:${port}`;
const app = createIntegratedExpressApp({ appBaseUrl, nodeEnv: 'production' });

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Missing build output. Run `npm run build` before `npm run preview`.');
  process.exit(1);
}

app.use(signflowExpress.static(distDir));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/signflow/')) {
    next();
    return;
  }

  const requestedAsset = path.join(distDir, req.path.replace(/^\/+/, ''));
  if (fs.existsSync(requestedAsset) && fs.statSync(requestedAsset).isFile()) {
    res.sendFile(requestedAsset);
    return;
  }

  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  if (port !== requestedPort) {
    console.log(`Requested preview port ${requestedPort} was busy, using ${port} instead.`);
  }
  console.log(`\nIntegrated ICU + SignFlow preview server running at ${appBaseUrl}`);
  console.log(`SignFlow API: ${appBaseUrl}/signflow/api/health`);
});
