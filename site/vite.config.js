import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site reads ../level-*/*.json and the repo's own docs at build time, so every number on the page is generated, never typed.
export default defineConfig({
  base: '/agent-from-scratch/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
