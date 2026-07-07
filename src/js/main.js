import 'pretendard/dist/web/static/pretendard.css'
import '@noonnu/hangeul-nuri-bold/index.css'
import '../scss/main.scss'
import { initHero } from './hero-cube.js'

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

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu()
  initHero()
})
