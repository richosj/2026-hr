import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let lenisInstance = null
const scrollListeners = new Set()

export function getLenis() {
  return lenisInstance
}

/** Lenis scroll과 동기화된 업데이트 (모바일 터치 포함) */
export function onScroll(fn) {
  scrollListeners.add(fn)
  return () => scrollListeners.delete(fn)
}

function emitScroll() {
  scrollListeners.forEach((fn) => fn())
}

/** 참고 사이트(경기기후플랫폼)와 동일하게 Lenis 스무스 스크롤 */
export function initSmoothScroll() {
  if (lenisInstance) return lenisInstance

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches

  lenisInstance = new Lenis({
    autoRaf: true,
    lerp: isCoarsePointer ? 0.07 : 0.058,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.075,
    touchMultiplier: 1.05,
    touchInertiaExponent: 1.85,
    wheelMultiplier: 0.88,
  })

  lenisInstance.on('scroll', emitScroll)

  window.lenis = lenisInstance

  return lenisInstance
}

export function scrollToTop() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { duration: 1.2 })
    return
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
