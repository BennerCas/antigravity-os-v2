import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import refreshSkillsPlugin from './refresh-skills-plugin.js';

// https://vite.dev/config/
// VITE_BASE_PATH set in CI for GitHub Pages (e.g. /antigravity-awesome-skills/); default / for local dev
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), refreshSkillsPlugin()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
