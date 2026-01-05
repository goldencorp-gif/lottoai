
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Robust definition of process.env to support both build-time variables and runtime injection.
    // If API_KEY is present at build time, we use it. 
    // Otherwise, we map process.env to globalThis.process.env (if available) or an empty object.
    // This allows tools like AI Studio to inject the key at runtime without Vite overwriting it with "".
    'process.env': process.env.API_KEY 
      ? { API_KEY: process.env.API_KEY } 
      : 'globalThis.process?.env || {}'
  },
});
