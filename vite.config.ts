import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { browserAuthEnvironment, needsConnectedMode } from './src/app/auth/config.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const publicEnv = browserAuthEnvironment(env)
  const connected = needsConnectedMode({ ...publicEnv, MODE: mode })
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: [],
    define: Object.fromEntries(
      Object.entries(publicEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    server: { host: '127.0.0.1', port: connected ? 5174 : 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: connected ? 4174 : 4173, strictPort: true },
  }
})
