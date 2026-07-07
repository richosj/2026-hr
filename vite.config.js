import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pageData = {
  '/index.html': {
    title: 'Creative Agency',
    description: '2026 HR — Creative Agency Hero',
  },
  '/about.html': {
    title: '소개',
    description: '2026 HR 프로젝트 소개',
  },
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/2026-hr/' : '/',
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, 'partials'),
      context(pagePath) {
        return pageData[pagePath] ?? {
          title: '2026 HR',
          description: '2026 HR 프로젝트',
        }
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, 'src/scss')],
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        about: path.resolve(__dirname, 'about.html'),
      },
    },
  },
}))
