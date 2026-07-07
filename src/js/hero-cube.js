import cubeFront from '../assets/images/hero/cube-front.jpg'
import cubeRight from '../assets/images/hero/cube-right.jpg'
import cubeLeft from '../assets/images/hero/cube-left.jpg'
import cubeBottom from '../assets/images/hero/cube-bottom.jpg'
import cubeTop from '../assets/images/hero/cube-top.jpg'

const DESKTOP_QUERY = '(min-width: 992px)'
const ROTATION_RANGE = 80
const SMOOTHING = 0.035

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
  let rafId = null
  let mobileTimer = null

  const applyRotation = () => {
    cube.style.transform = `translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(${currentX}deg) rotateY(${currentY}deg) rotateZ(0deg) skew(0deg, 0deg)`
  }

  const tick = () => {
    currentX += (targetX - currentX) * SMOOTHING
    currentY += (targetY - currentY) * SMOOTHING
    applyRotation()
    rafId = requestAnimationFrame(tick)
  }

  const startLoop = () => {
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const handleMouseMove = (event) => {
    const rect = hero.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    targetY = (x - 0.5) * 2 * ROTATION_RANGE
    targetX = (0.5 - y) * 2 * ROTATION_RANGE
  }

  const mobileKeyframes = [
    { x: 0, y: 0 },
    { x: 15, y: 15 },
    { x: -15, y: 15 },
    { x: -15, y: -15 },
    { x: 15, y: -15 },
    { x: 0, y: 0 },
  ]

  const startMobileLoop = () => {
    let index = 0

    const step = () => {
      const next = mobileKeyframes[(index + 1) % mobileKeyframes.length]
      targetX = next.x
      targetY = next.y
      index = (index + 1) % mobileKeyframes.length
      mobileTimer = window.setTimeout(step, 4000)
    }

    step()
  }

  const stopMobileLoop = () => {
    if (mobileTimer) {
      window.clearTimeout(mobileTimer)
      mobileTimer = null
    }
  }

  const enableDesktop = () => {
    stopMobileLoop()
    hero.addEventListener('mousemove', handleMouseMove)
    startLoop()
  }

  const enableMobile = () => {
    hero.removeEventListener('mousemove', handleMouseMove)
    stopMobileLoop()
    targetX = 0
    targetY = 0
    currentX = 0
    currentY = 0
    applyRotation()
    startLoop()
    startMobileLoop()
  }

  const media = window.matchMedia(DESKTOP_QUERY)
  const syncMode = () => {
    stopLoop()
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
