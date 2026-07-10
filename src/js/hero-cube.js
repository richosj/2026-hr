import cubeFront from '../assets/images/hero/cube-front.jpg'
import cubeRight from '../assets/images/hero/cube-right.jpg'
import cubeLeft from '../assets/images/hero/cube-left.jpg'
import cubeBottom from '../assets/images/hero/cube-bottom.jpg'
import cubeTop from '../assets/images/hero/cube-top.jpg'

const DESKTOP_QUERY = '(min-width: 992px)'
const ROTATION_RANGE = 80
const DESKTOP_SMOOTHING = 0.035

// Webflow a-329 — 991px 이하에서 4초 easeInOut 자동 루프
const MOBILE_STOPS = [
  { x: 15, y: 15, duration: 4000 },
  { x: -15, y: 15, duration: 4000 },
  { x: -15, y: -15, duration: 4000 },
  { x: 15, y: -15, duration: 4000 },
  { x: 0, y: 0, duration: 4000 },
]

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function initCubeImages() {
  const sources = [
    ['.cube-front img', cubeFront],
    ['.cube-right img', cubeRight],
    ['.cube-left img', cubeLeft],
    ['.cube-bottom img', cubeBottom],
    ['.cube-top img', cubeTop],
  ]

  sources.forEach(([selector, src]) => {
    const img = document.querySelector(selector)
    if (img) img.src = src
  })
}

function initHeroCube() {
  const hero = document.getElementById('hero')
  const cube = document.getElementById('heroCube')
  if (!hero || !cube) return

  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let desktopRafId = null
  let mobileRafId = null
  let mobileStopIndex = 0
  let mobileFromX = 0
  let mobileFromY = 0
  let isDesktopMode = false

  const applyRotation = () => {
    cube.style.transform = `translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(${currentX}deg) rotateY(${currentY}deg) rotateZ(0deg) skew(0deg, 0deg)`
  }

  const desktopTick = () => {
    currentX += (targetX - currentX) * DESKTOP_SMOOTHING
    currentY += (targetY - currentY) * DESKTOP_SMOOTHING
    applyRotation()
    desktopRafId = requestAnimationFrame(desktopTick)
  }

  const startDesktopLoop = () => {
    if (!desktopRafId) desktopRafId = requestAnimationFrame(desktopTick)
  }

  const stopDesktopLoop = () => {
    if (desktopRafId) {
      cancelAnimationFrame(desktopRafId)
      desktopRafId = null
    }
  }

  const handleMouseMove = (event) => {
    if (!isDesktopMode) return

    const rect = hero.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    targetY = (x - 0.5) * 2 * ROTATION_RANGE
    targetX = (0.5 - y) * 2 * ROTATION_RANGE
  }

  const runMobileStop = () => {
    const stop = MOBILE_STOPS[mobileStopIndex]
    const startX = mobileFromX
    const startY = mobileFromY
    const startTime = performance.now()

    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / stop.duration)
      const eased = easeInOut(progress)

      currentX = startX + (stop.x - startX) * eased
      currentY = startY + (stop.y - startY) * eased
      applyRotation()

      if (progress < 1) {
        mobileRafId = requestAnimationFrame(step)
        return
      }

      mobileFromX = stop.x
      mobileFromY = stop.y
      mobileStopIndex = (mobileStopIndex + 1) % MOBILE_STOPS.length
      runMobileStop()
    }

    mobileRafId = requestAnimationFrame(step)
  }

  const startMobileLoop = () => {
    stopMobileLoop()
    mobileStopIndex = 0
    mobileFromX = 0
    mobileFromY = 0
    currentX = 0
    currentY = 0
    targetX = 0
    targetY = 0
    applyRotation()
    runMobileStop()
  }

  const stopMobileLoop = () => {
    if (mobileRafId) {
      cancelAnimationFrame(mobileRafId)
      mobileRafId = null
    }
  }

  const enableDesktop = () => {
    isDesktopMode = true
    stopMobileLoop()
    hero.addEventListener('mousemove', handleMouseMove)
    startDesktopLoop()
  }

  const enableMobile = () => {
    isDesktopMode = false
    hero.removeEventListener('mousemove', handleMouseMove)
    stopDesktopLoop()
    startMobileLoop()
  }

  const media = window.matchMedia(DESKTOP_QUERY)
  const syncMode = () => {
    if (media.matches) enableDesktop()
    else enableMobile()
  }

  syncMode()
  media.addEventListener('change', syncMode)
}

export function initHero() {
  initCubeImages()
  initHeroCube()
}
