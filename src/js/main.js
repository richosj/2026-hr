import 'pretendard/dist/web/static/pretendard.css'
import '@noonnu/hangeul-nuri-bold/index.css'
import '../scss/main.scss'
import { initHero } from './hero-cube.js'
import { initIntroCubeScroll } from './intro-cube-scroll.js'
import { initFeatureScroll } from './feature-scroll.js'
import { initSmoothScroll, scrollToTop, getLenis, onScroll } from './smooth-scroll.js'

function initHeaderScroll() {
  const header = document.getElementById('header')
  if (!header) return

  const update = () => {
    const scroll = getLenis()?.scroll ?? window.scrollY
    header.classList.toggle('is-scrolled', scroll > 8)
  }

  onScroll(update)
  update()
}

function initMobileMenu() {
  const header = document.getElementById('header')
  const menuBtn = document.getElementById('menuBtn')
  const mobileMenu = document.getElementById('mobileMenu')
  const backdrop = document.getElementById('menuBackdrop')
  const mobileNav = document.getElementById('mobileNav')

  if (!header || !menuBtn || !mobileMenu || !mobileNav) return

  let scrollLockY = 0

  const lockScroll = () => {
    scrollLockY = window.scrollY
    document.documentElement.classList.add('is-menu-open')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    getLenis()?.stop()
  }

  const unlockScroll = () => {
    document.documentElement.classList.remove('is-menu-open')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollLockY)
    getLenis()?.start()
    getLenis()?.scrollTo(scrollLockY, { immediate: true })
  }

  const setOpen = (open) => {
    header.classList.toggle('is-menu-open', open)
    mobileMenu.classList.toggle('is-open', open)
    menuBtn.classList.toggle('is-open', open)
    menuBtn.setAttribute('aria-expanded', String(open))
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기')
    mobileMenu.setAttribute('aria-hidden', String(!open))

    if (open) {
      lockScroll()
    } else {
      unlockScroll()
    }
  }

  menuBtn.addEventListener('click', () => {
    setOpen(!mobileMenu.classList.contains('is-open'))
  })

  backdrop?.addEventListener('click', () => setOpen(false))

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false)
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1280 && mobileMenu.classList.contains('is-open')) {
      setOpen(false)
    }
  })
}

function initTopButton() {
  const topBtn = document.getElementById('topBtn')
  if (!topBtn) return

  topBtn.addEventListener('click', () => {
    scrollToTop()
  })

  const updateVisibility = () => {
    const scroll = getLenis()?.scroll ?? window.scrollY
    const showAfter = window.innerHeight
    topBtn.classList.toggle('is-visible', scroll > showAfter)
  }

  onScroll(updateVisibility)
  updateVisibility()

  window.addEventListener('resize', updateVisibility)
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll()
  initHeaderScroll()
  initMobileMenu()
  initTopButton()
  initHero()
  initIntroCubeScroll()
  initFeatureScroll()
})
