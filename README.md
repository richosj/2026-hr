# 2026 HR

Vite + HTML/SCSS/JS 기반 모바일 우선 반응형 웹 프로젝트입니다.

## 기술 스택

- [Vite](https://vitejs.dev/) — 빌드 도구
- SCSS — 스타일 (모바일 우선)
- [vite-plugin-handlebars](https://www.npmjs.com/package/vite-plugin-handlebars) — Handlebars partials (`{{> meta}}`)
- [Pretendard](https://www.npmjs.com/package/pretendard) — 본문 폰트
- [@noonnu/hangeul-nuri-bold](https://www.npmjs.com/package/@noonnu/hangeul-nuri-bold) — 제목 폰트

## 시작하기

```bash
npm install
npm run dev
```

로컬 개발 서버: http://localhost:5173

## 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
├── index.html              # 홈 — 본문만 작성
├── about.html              # 소개 — 본문만 작성
├── partials/
│   ├── layout.html         # 공통 레이아웃 (meta, header, footer)
│   ├── meta.html           # {{> meta}}
│   ├── header.html         # {{> header}}
│   ├── footer.html         # {{> footer}}
│   └── scripts.html        # {{> scripts}}
├── src/
│   ├── scss/
│   └── js/
│       └── main.js
└── .github/workflows/
    └── deploy.yml
```

## 페이지 작성법 (본문만)

각 HTML 파일에는 **본문 콘텐츠만** 작성합니다. 상하단·meta는 `partials/`에서 자동으로 감쌉니다.

```html
{{#> layout}}
<section class="hero">
  <h1>제목</h1>
  <p>본문 내용</p>
</section>
{{/layout}}
```

## 새 페이지 추가

1. 루트에 `새페이지.html` 생성 (위 패턴으로 본문만 작성)
2. `vite.config.js`의 `pageData`에 title/description 추가
3. `vite.config.js`의 `build.rollupOptions.input`에 엔트리 추가

## GitHub Pages 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포합니다.

1. [Settings → Pages](https://github.com/ALL4UITeam/2026-hr/settings/pages) 에서 **Build and deployment → Source** 를 **GitHub Actions** 로 설정 (최초 1회)
2. `main` 브랜치에 push (또는 Actions 탭에서 **Deploy to GitHub Pages** 수동 실행)
3. 배포 URL: https://ALL4UITeam.github.io/2026-hr/

> 첫 배포가 실패했다면 Pages Source가 GitHub Actions로 설정됐는지 확인한 뒤 워크플로를 다시 실행하세요.
