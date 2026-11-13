import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = resolve(here, '../..');

export default defineConfig({
  base: '/texas-42/',
  plugins: [react()],
  resolve: {
    alias: {
      // Consume the shared package straight from source (no build step needed).
      '@texas42/shared': resolve(workspaceRoot, 'packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow Vite to read the workspace source for the aliased package.
      allow: [workspaceRoot],
    },
  },
  build: {
    target: 'es2022',
  },
});
