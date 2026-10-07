import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dashboard's fixed development port. `strictPort` makes Vite stop when
// the port is taken instead of moving to the next one, which is not ours.
const server = {
  port: 3002,
  strictPort: true,
  host: 'localhost',
};

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/dashboard',
  server,
  preview: server,
  plugins: [react()],
  resolve: {
    // Resolves the `@/` alias declared in tsconfig.app.json
    tsconfigPaths: true,
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
}));
