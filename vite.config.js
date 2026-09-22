import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function wkWebViewBundle() {
  return {
    name: 'oivox-wkwebview-classic-script',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'asset' || !item.fileName.endsWith('.html')) continue
        item.source = String(item.source)
          .replace(/<script type="module" crossorigin/g, '<script defer')
          .replace(/<script type="module"/g, '<script defer')
          .replace(/<script crossorigin/g, '<script defer')
          .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"')
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [vue(), wkWebViewBundle()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'ios15',
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
})
