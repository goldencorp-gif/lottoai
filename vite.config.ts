
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Robustly define process.env.API_KEY as a string literal.
    // This allows the frontend to access the key if it's set in the build environment or .env file.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
});
