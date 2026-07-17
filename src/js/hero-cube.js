import cubeLeft from '../assets/images/hero/home_visual_01@2x.jpg'
import cubeFront from '../assets/images/hero/home_visual_02@2x.jpg'
import cubeRight from '../assets/images/hero/home_visual_04@2x.jpg'
import cubeTop from '../assets/images/hero/home_visual_05@2x.jpg'
import cubeBottom from '../assets/images/hero/home_visual_06@2x.jpg'

import { HERO_CUBE_LARGE_QUERY, HERO_DESKTOP_QUERY } from './breakpoints.js'

const DESKTOP_QUERY = HERO_DESKTOP_QUERY
const CUBE_LARGE_QUERY = HERO_CUBE_LARGE_QUERY
const ROTATION_RANGE = 55
const DESKTOP_SMOOTHING = 0.035

// 모바일 자동 회전
const MOBILE_STOPS = [
  { x: 15, y: 15, duration: 2800 },
  { x: -15, y: 15, duration: 2800 },
  { x: -15, y: -15, duration: 2800 },
  { x: 15, y: -15, duration: 2800 },
  { x: 0, y: 0, duration: 2800 },
]

let cubeElement = null
let currentX = 0
let currentY = 0
let mobilePaused = false
let flightMode = false
let flightTravelT = 0
let flightMorphExpand = 0

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

const OPTICAL_Y = {
  mobile: -0.02,
  desktop: -0.03,
}

function applyRotation() {
  if (!cubeElement) return

  const isLargeCube = window.matchMedia(CUBE_LARGE_QUERY).matches
  const opticalY = isLargeCube ? OPTICAL_Y.desktop : OPTICAL_Y.mobile

  cubeElement.style.transform = `translate3d(0, ${opticalY * 100}%, 0) scale3d(1, 1, 1) rotateX(${currentX}deg) rotateY(${currentY}deg) rotateZ(0deg)`
}

/** intro 스크롤 비행 중 / hero 복귀 시 회전 리셋 */
export function resetHeroCubeRotation() {
  currentX = 0
  currentY = 0
  applyRotation()
}

/** true: 자동·마우스 회전 정지 (intro 비행·착지) */
export function setHeroCubeFlightMode(isFlying) {
  mobilePaused = isFlying
  flightMode = isFlying

  if (isFlying) {
    currentX = 0
    currentY = 0
    applyRotation()
  }
}

/**
 * intro 비행 중 Y축 와리가리 — RAF에서 flightTravelT 기준 적용
 */
function applyFlightRotation() {
  if (!cubeElement || !flightMode) return

  const t = clamp(flightTravelT, 0, 1)
  const travelSwing = Math.sin(t * Math.PI) * 20
  const settle = t >= 0.985 ? (1 - flightMorphExpand) * travelSwing : travelSwing

  currentX = 0
  currentY = settle
  applyRotation()
}

/**
 * @param {number} travelT 0~1
 * @param {number} morphExpand intro pin 펼침 0~1
 */
export function updateHeroCubeFlightMotion(travelT, morphExpand = 0) {
  flightTravelT = travelT
  flightMorphExpand = morphExpand
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
  const heroStage = document.getElementById('heroStage')
  const cube = document.getElementById('heroCube')
  if (!hero || !cube) return

  cubeElement = cube

  let targetX = 0
  let targetY = 0
  let desktopRafId = null
  let mobileRafId = null
  let mobileStopIndex = 0
  let mobileFromX = 0
  let mobileFromY = 0
  let isDesktopMode = false

  const getInteractionRect = () => {
    const wrapper = cube.closest('.cube-wrapper')
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return rect
    }

    return (heroStage || hero).getBoundingClientRect()
  }

  const desktopTick = () => {
    if (flightMode) {
      applyFlightRotation()
    } else {
      currentX += (targetX - currentX) * DESKTOP_SMOOTHING
      currentY += (targetY - currentY) * DESKTOP_SMOOTHING
      applyRotation()
    }
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
    if (!isDesktopMode || flightMode) return

    const rect = getInteractionRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)

    targetY = (x - 0.5) * 2 * ROTATION_RANGE
    targetX = (0.5 - y) * 2 * ROTATION_RANGE
  }

  const runMobileStop = () => {
    if (mobilePaused) {
      applyFlightRotation()
      mobileRafId = requestAnimationFrame(runMobileStop)
      return
    }

    const stop = MOBILE_STOPS[mobileStopIndex]
    const startX = mobileFromX
    const startY = mobileFromY
    const startTime = performance.now()

    const step = (now) => {
      if (mobilePaused) {
        applyFlightRotation()
        mobileRafId = requestAnimationFrame(step)
        return
      }

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
    resetHeroCubeRotation()
    targetX = 0
    targetY = 0
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
    mobilePaused = false
    stopMobileLoop()
    document.addEventListener('mousemove', handleMouseMove)
    startDesktopLoop()
  }

  const enableMobile = () => {
    isDesktopMode = false
    document.removeEventListener('mousemove', handleMouseMove)
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
