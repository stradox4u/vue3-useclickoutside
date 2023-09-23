import { resolve } from 'path';


export default {
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      name: 'UseClickOutside',
      fileName: 'use-click-outside',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        formats: ['es', 'cjs', 'umd']
      }
    }
  },
}