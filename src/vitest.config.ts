import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/index.ts', '**/types/**', '**/constants/**'],
      include: [
        'bundler/**/*.ts',
        'relayer/**/*.ts',
        'account/**/*.ts',
        'utils/**/*.ts',
        'ws/**/*.ts'
      ],
      provider: 'v8'
    },
    environment: 'node',
    globals: true
  }
});
