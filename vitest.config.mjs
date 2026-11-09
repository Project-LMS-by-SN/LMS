import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const currentDir = import.meta.dirname || process.cwd();

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    testTimeout: 15000,
  },
  resolve: {
    alias: [
      { find: /^react$/, replacement: path.resolve(currentDir, 'node_modules/react') },
      { find: /^react\/(.*)$/, replacement: path.resolve(currentDir, 'node_modules/react/$1') },
      { find: /^react-dom$/, replacement: path.resolve(currentDir, 'node_modules/react-dom') },
      { find: /^react-dom\/(.*)$/, replacement: path.resolve(currentDir, 'node_modules/react-dom/$1') },
      { find: /^react-router$/, replacement: path.resolve(currentDir, 'node_modules/react-router') },
      { find: /^react-router-dom$/, replacement: path.resolve(currentDir, 'node_modules/react-router-dom') },
      { find: '@frontend', replacement: path.resolve(currentDir, 'frontend/src') },
      { find: '@backend', replacement: path.resolve(currentDir, 'backend/src') },
    ],
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
});
