import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    forks: { singleFork: true },
    //setupFiles: ['test-setup.ts'],
    retry: process.env.CI ? 2 : 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: path.resolve(__dirname, '../../coverage/libs/core'),
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/mocks/**', '**/index.ts'],
      all: true,
    },
  },
  resolve: {
    alias: {
      '@libs/core': path.resolve(__dirname, './src'),
    },
  },
});