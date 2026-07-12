import 'pretendard/dist/web/static/pretendard.css'
import '@noonnu/hangeul-nuri-bold/index.css'
import '../scss/main.scss'
import { initHero } from './hero-cube.js'
import { initIntroCubeScroll } from './intro-cube-scroll.js'
import { initFeatureScroll } from './feature-scroll.js'
import { initSmoothScroll, scrollToTop, getLenis, onScroll } from './smooth-scroll.js'

function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn')
  const gnb = document.getElementById('gnb')

  if (!menuBtn || !gnb) return

  menuBtn.addEventListener('click', () => {
    const isOpen = gnb.classList.toggle('is-open')
    menuBtn.setAttribute('aria-expanded', String(isOpen))
    menuBtn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기')
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
  initMobileMenu()
  initTopButton()
  initHero()
  initIntroCubeScroll()
  initFeatureScroll()
})
