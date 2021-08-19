import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/thor.ts'),
      name: 'thor',
      fileName: 'thor'
    },
    rollupOptions: {
      external: ['fs', 'fs/promises', 'process']
    }
  }
});
