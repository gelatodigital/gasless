import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@gelatocloud/gasless': resolve(__dirname, '../../src/index.ts')
    }
  }
});
