import { defineConfig } from 'vite';

export default defineConfig({
  base: '/clutch-web/',
  server: {
    host: true,   // Ağdaki tüm cihazlardan erişime aç (iPad, telefon vs.)
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
