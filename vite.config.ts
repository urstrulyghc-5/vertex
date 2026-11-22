import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repository at /vertex/.
export default defineConfig({
  base: '/vertex/',
  plugins: [react()],
});
