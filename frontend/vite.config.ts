import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/dist',
  },
});
