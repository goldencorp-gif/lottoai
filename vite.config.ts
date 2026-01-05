import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env.API_KEY for the browser.
    // We use || '' to ensure it doesn't crash if the env var is undefined during build.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  // Vercel handles API routing automatically via the /api directory, so no server proxy is needed for production.
});