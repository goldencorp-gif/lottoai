
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // If API_KEY is present at build time (e.g. Vercel env vars), inject it.
    // Otherwise, define process.env as empty object to prevent "process is not defined" errors.
    // Runtime injection (e.g. AI Studio) is handled in the service layer via window.process.
    'process.env': process.env.API_KEY 
      ? { API_KEY: process.env.API_KEY } 
      : {}
  },
});
