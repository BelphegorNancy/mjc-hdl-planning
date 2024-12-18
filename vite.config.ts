import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});