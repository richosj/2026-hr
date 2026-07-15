import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pageData = {
  '/index.html': {
    title: '2026 HR FAIR',
    description: '엑스퍼트컨설팅 2026 HR FAIR — AI시대, HSS에 주목하라',
  },
  '/about.html': {
    title: '소개',
    description: '2026 HR 프로젝트 소개',
  },
  '/program.html': {
    title: '프로그램',
    description: '2026 엑스퍼트 HR FAIR 프로그램 안내',
  },
  '/program-modals-preview.html': {
    title: '프로그램 팝업 미리보기',
    description: '프로그램 모달 개발용 미리보기',
  },
  '/location.html': {
    title: '찾아오시는 길',
    description: '2026 엑스퍼트 HR FAIR 행사장 위치 및 교통 안내',
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
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        about: path.resolve(__dirname, 'about.html'),
        program: path.resolve(__dirname, 'program.html'),
        programModalsPreview: path.resolve(__dirname, 'program-modals-preview.html'),
        location: path.resolve(__dirname, 'location.html'),
      },
    },
  },
}))
