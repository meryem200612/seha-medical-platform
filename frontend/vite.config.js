import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || 'http://localhost:5173'),
      'import.meta.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || 'http://localhost:8000'),
    },
  };
})
