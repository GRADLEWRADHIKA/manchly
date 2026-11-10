import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { BASE_URL } from './src/utils/backendConfig.js'

// Dev proxy: the app calls /__api/... and Socket.IO on the same origin; vite
// forwards both to the backend selected in src/utils/backendConfig.js
// (production server.manchly.com by default, or local when USE_LOCAL_BACKEND).
// Same-origin requests mean the backend CORS allowlist never blocks dev.
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/__api': {
        target: BASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__api/, ''),
      },
      '/socket.io': {
        target: BASE_URL,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
