import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Root is this `renderer/` directory (passed positionally: `vite renderer`).
export default defineConfig({
  plugins: [react()],
  // Relative base so the built index.html loads assets over file:// in Electron.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
