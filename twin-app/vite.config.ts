import { fileURLToPath, URL } from 'node:url'
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { defineConfig } from 'vite'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

function signflowDevBackendPlugin(): Plugin {
  let child: ChildProcess | null = null
  let appPort = 5173

  return {
    name: 'signflow-dev-backend',
    apply: 'serve',
    configResolved(config: ResolvedConfig) {
      appPort = config.server.port || 5173
    },
    configureServer(server: ViteDevServer) {
      if (child) return

      const backendDir = fileURLToPath(new URL('./server/signflow-backend', import.meta.url))
      child = spawn(process.execPath, ['server.js'], {
        cwd: backendDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: process.env.SIGNFLOW_PORT || '4000',
          APP_BASE_URL: `http://localhost:${appPort}`,
        },
      })

      const shutdown = () => {
        if (child && !child.killed) {
          child.kill()
        }
        child = null
      }

      server.httpServer?.once('close', shutdown)
      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), signflowDevBackendPlugin()],
  resolve: {
    alias: {
      routes: fileURLToPath(new URL('./src/horizon/routes.jsx', import.meta.url)),
      'routes.js': fileURLToPath(new URL('./src/horizon/routes.jsx', import.meta.url)),
      'routes.jsx': fileURLToPath(new URL('./src/horizon/routes.jsx', import.meta.url)),
      assets: fileURLToPath(new URL('./src/horizon/assets', import.meta.url)),
      components: fileURLToPath(new URL('./src/horizon/components', import.meta.url)),
      contexts: fileURLToPath(new URL('./src/horizon/contexts', import.meta.url)),
      layouts: fileURLToPath(new URL('./src/horizon/layouts', import.meta.url)),
      theme: fileURLToPath(new URL('./src/horizon/theme', import.meta.url)),
      variables: fileURLToPath(new URL('./src/horizon/variables', import.meta.url)),
      views: fileURLToPath(new URL('./src/horizon/views', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/signflow/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/signflow/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})