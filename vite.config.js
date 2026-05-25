import { defineConfig } from 'vite';

export default defineConfig({
  base: '/clutch-web/',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
