import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces (required for Docker)
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Required for file watching in Docker volumes
    },
    proxy: {
      '/api': {
        target: 'https://dfa652ee-bdb5-4b20-9cc8-ebe111228af2-agent.ai-agent.inference.cloud.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
})
