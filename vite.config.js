import { fileURLToPath } from 'node:url';

export default {
  build: {
    target: 'es2020',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'UseClickOutside',
      fileName: 'use-click-outside',
      formats: ['es', 'umd'],
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
};
