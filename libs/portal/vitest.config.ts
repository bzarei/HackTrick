import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      swcrc: false,  // ignore .swcrc - we configure inline
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2022',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    setupFiles: [path.resolve(__dirname, 'src/test-setup.ts')],
    retry: process.env.CI ? 2 : 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: path.resolve(__dirname, '../../coverage/libs/portal'),
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/mocks/**', '**/index.ts'],
      all: true,
    },
  },
  resolve: {
    alias: {
      '@libs/portal': path.resolve(__dirname, './src'),
    },
  },
});