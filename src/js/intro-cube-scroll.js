import { HERO_CUBE_LARGE_QUERY, HERO_DESKTOP_QUERY } from './breakpoints.js'
import { onScroll } from './smooth-scroll.js'

const CUBE_LARGE_QUERY = HERO_CUBE_LARGE_QUERY
const DESKTOP_QUERY = HERO_DESKTOP_QUERY
const MOBILE_CUBE_VH = 0.25
const DESKTOP_CUBE_VH = 0.4
const CUBE_END_VH = 0.25
const MORPH_PIN_START = 0.08
const MORPH_PIN_END = 0.62
const SENSE_MORPH_START = 0.07
const SENSE_MORPH_END = 0.78
const SENS_MORPH_START = 0.196
const SENS_MORPH_END = 0.62
const TRAVEL_OFF = 0.008
const FLIGHT_START_VH = 1.1
const FLIGHT_END_VH = 0.04
// 스크롤 비행 진행률 기준 텍스트 등장 시점: 0.7 = 도착 30% 전
const TEXT_REVEAL_TRAVEL_T = 0.7
// PC hero 제목이 화면 상단에 이 비율만 남으면 intro 텍스트 등장 준비
const DESKTOP_HEADING_REMAINING_RATIO = 0.2
// intro 텍스트가 뷰포트 하단 이 지점에 들어오면 fade 시작
const INTRO_TEXT_VIEWPORT_REVEAL_RATIO = 0.9
const FLIGHT_SMOOTH = 0.1
const RETURN_SMOOTH = 0.35
const RETURN_DONE = 0.004
const RETURN_SLOT_REVEAL = 0.35

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

/**
 * 큐브는 heroComponent 안에 그대로 두고,
 * fixed 좌표만 #cubeLanding 쪽으로 이동 (DOM reparent 없음)
 */
export function initIntroCubeScroll() {
  const cube = document.getElementById('heroCube')
  const cubeWrapper = document.querySelector('.cube-wrapper')
  const heroStage = document.getElementById('heroStage')
  const intro = document.getElementById('intro-hss')
  const landing = document.getElementById('cubeLanding')
  const eyebrow = document.getElementById('introEyebrow')
  const morphTitle = document.getElementById('introMorphTitle')
  const heroCta = document.getElementById('heroCta')
  const cubeSlot = document.getElementById('heroCubeSlot')
  const message = document.getElementById('message')
  const sensibility = document.getElementById('sensibility')
  const desktopHeroHeading = document.querySelector(
    '.home-2-hero--desktop .home-hero-heading',
  )

  if (!cube || !cubeWrapper || !heroStage || !intro || !landing || !cubeSlot) return

  const restNodes = morphTitle
    ? [...morphTitle.querySelectorAll('.morph-item__rest')]
    : []

  let morphComplete = false
  let travelActive = false
  let smoothTravelT = 0

  const isLargeCube = () => window.matchMedia(CUBE_LARGE_QUERY).matches

  const getFallbackStartSize = () =>
    window.innerHeight * (isLargeCube() ? DESKTOP_CUBE_VH : MOBILE_CUBE_VH)

  const getFallbackEndSize = () => window.innerHeight * CUBE_END_VH

  /** SCSS vh 변수 → px (회전 bbox가 아닌 CSS 원본 크기) */
  const readCssLength = (element, varName, fallback) => {
    const raw = getComputedStyle(element).getPropertyValue(varName).trim()
    if (!raw) return fallback

    if (raw.endsWith('vh')) {
      return (window.innerHeight * parseFloat(raw)) / 100
    }

    if (raw.endsWith('px')) {
      return parseFloat(raw)
    }

    return fallback
  }

  const getStartSize = () => {
    const varName = isLargeCube() ? '--hero-cube-size-desktop' : '--hero-cube-size'
    return readCssLength(document.body, varName, getFallbackStartSize())
  }

  const getEndSize = () =>
    readCssLength(document.body, '--hero-cube-end-size', getFallbackEndSize())

  const centerRect = (rect, size) => ({
    left: rect.left + (rect.width - size) / 2,
    top: rect.top + (rect.height - size) / 2,
    size,
  })

  const getLiveHeroSlot = () => centerRect(cubeSlot.getBoundingClientRect(), getStartSize())

  const getLandingSlot = () => {
    const size = getEndSize()
    const landingRect = landing.getBoundingClientRect()

    return {
      left: landingRect.left + (landingRect.width - size) / 2,
      top: landingRect.top + (landingRect.height - size) / 2,
      size,
    }
  }

  const clearFlightStyles = () => {
    cubeWrapper.style.left = ''
    cubeWrapper.style.top = ''
    cubeWrapper.style.width = ''
    cubeWrapper.style.height = ''
    cubeWrapper.style.transform = ''
    cube.style.width = ''
    cube.style.height = ''
    cube.style.removeProperty('--cube-size')
    cube.style.removeProperty('--cube-half')
  }

  const finishReturnToHero = () => {
    travelActive = false
    smoothTravelT = 0
    cubeWrapper.classList.remove('is-traveling')
    clearFlightStyles()
  }

  const syncRestingCube = () => {
    if (travelActive || cubeWrapper.classList.contains('is-traveling')) return
    clearFlightStyles()
  }

  const placeCube = (left, top, size) => {
    if (!travelActive) {
      travelActive = true
      cubeWrapper.classList.add('is-traveling')
    }

    cubeWrapper.style.left = `${left}px`
    cubeWrapper.style.top = `${top}px`
    cubeWrapper.style.width = `${size}px`
    cubeWrapper.style.height = `${size}px`
    cubeWrapper.style.transform = 'translate3d(0, 0, 0)'
    cube.style.width = `${size}px`
    cube.style.height = `${size}px`
    cube.style.setProperty('--cube-size', `${size}px`)
    cube.style.setProperty('--cube-half', `${size * 0.5}px`)
  }

  /** hero 슬롯이 화면 위로 벗어난 동안만 landing 쪽 유지 */
  const getReturnMoveCap = (vh) => {
    const slot = cubeSlot.getBoundingClientRect()

    if (slot.bottom <= 0) return 1

    const reveal = clamp(slot.bottom / (vh * RETURN_SLOT_REVEAL), 0, 1)
    return 1 - easeOutCubic(reveal)
  }

  const canFinishReturn = (moveT, vh, travelT) => {
    const slot = cubeSlot.getBoundingClientRect()
    const heroVisible = slot.bottom > 0 && slot.top < vh

    if (!heroVisible) return false
    return moveT <= RETURN_DONE || travelT <= 0
  }

  const updateCta = (vh) => {
    if (!heroCta) return

    const trackBottom = sensibility
      ? sensibility.getBoundingClientRect().bottom
      : heroStage.getBoundingClientRect().bottom

    if (trackBottom <= 0) {
      heroCta.classList.remove('is-active', 'is-white')
      heroCta.style.bottom = ''
      return
    }

    const bottom = Math.max(0, Math.round(vh - trackBottom))
    const useWhite = message
      ? message.getBoundingClientRect().top <= vh * 0.92
      : false

    // sensibility 끝에서 bottom 값이 올라가기 시작하면 CTA 숨김
    heroCta.classList.toggle('is-active', bottom <= 50)
    heroCta.classList.toggle('is-white', useWhite)
    heroCta.style.bottom = `${bottom}px`
  }

  const setMorphComplete = (complete) => {
    morphComplete = complete
    if (!morphTitle) return

    morphTitle.classList.toggle('is-morph-complete', complete)

    if (complete) {
      morphTitle.style.setProperty('--expand-sense', '1')
      morphTitle.style.setProperty('--expand-sensibility', '1')
      return
    }

    morphTitle.style.removeProperty('--expand-sense')
    morphTitle.style.removeProperty('--expand-sensibility')
  }

  const getSenseExpand = (pinProgress) =>
    easeInOutCubic(
      clamp((pinProgress - SENSE_MORPH_START) / (SENSE_MORPH_END - SENSE_MORPH_START), 0, 1),
    )

  const getSensExpand = (pinProgress) =>
    easeInOutCubic(
      clamp((pinProgress - SENS_MORPH_START) / (SENS_MORPH_END - SENS_MORPH_START), 0, 1),
    )

  const setMorphExpand = (pinProgress) => {
    if (!morphTitle) return
    morphTitle.style.setProperty('--expand-sense', String(getSenseExpand(pinProgress)))
    morphTitle.style.setProperty('--expand-sensibility', String(getSensExpand(pinProgress)))
  }

  const setText = (showTitle) => {
    if (eyebrow) eyebrow.classList.toggle('is-visible', showTitle)
    if (!morphTitle || morphComplete) return

    morphTitle.classList.toggle('is-visible', showTitle)
    const senseExpand = parseFloat(morphTitle.style.getPropertyValue('--expand-sense') || '0')
    const sensExpand = parseFloat(morphTitle.style.getPropertyValue('--expand-sensibility') || '0')
    morphTitle.setAttribute(
      'aria-label',
      Math.max(senseExpand, sensExpand) > 0.5 ? 'Human Sense, Sensibility' : 'HSS',
    )
  }

  const shouldShowIntroText = (travelT, vh) => {
    const titleInRevealZone = morphTitle
      ? morphTitle.getBoundingClientRect().top <= vh * INTRO_TEXT_VIEWPORT_REVEAL_RATIO
      : true

    if (window.matchMedia(DESKTOP_QUERY).matches && desktopHeroHeading) {
      const rect = desktopHeroHeading.getBoundingClientRect()
      if (rect.height > 0) {
        const remainingHeight = clamp(rect.bottom, 0, rect.height)
        const heroHeadingReady =
          remainingHeight <= rect.height * DESKTOP_HEADING_REMAINING_RATIO
        return heroHeadingReady && titleInRevealZone
      }
    }

    return travelT >= TEXT_REVEAL_TRAVEL_T && titleInRevealZone
  }

  const getTravelT = (introRect, vh) => {
    const flightStart = vh * FLIGHT_START_VH
    const flightEnd = vh * FLIGHT_END_VH
    const flightRange = Math.max(1, flightStart - flightEnd)

    if (introRect.top >= flightStart) return 0
    if (introRect.top <= flightEnd) return 1

    return clamp((flightStart - introRect.top) / flightRange, 0, 1)
  }

  /** 스크롤 거리에 비례 — 하단으로 갈수록 가속되지 않게, 착지만 살짝 감속 */
  const mapFlightProgress = (travelT) => easeOutCubic(travelT)

  const advanceTravelT = (targetT, atLanding = false) => {
    const smoothing = targetT < smoothTravelT ? RETURN_SMOOTH : FLIGHT_SMOOTH
    smoothTravelT += (targetT - smoothTravelT) * smoothing

    if (atLanding) {
      smoothTravelT = Math.max(smoothTravelT, targetT)
    }

    return smoothTravelT
  }

  const applyFlightTransform = (moveT, vh, isReturning) => {
    const heroSlot = getLiveHeroSlot()
    const landingSlot = getLandingSlot()
    let effectiveMoveT = moveT

    if (isReturning) {
      const cap = getReturnMoveCap(vh)
      effectiveMoveT = Math.max(moveT, cap)
      if (effectiveMoveT > smoothTravelT) {
        smoothTravelT = effectiveMoveT
      }
    }

    const left = lerp(heroSlot.left, landingSlot.left, effectiveMoveT)
    const top = lerp(heroSlot.top, landingSlot.top, effectiveMoveT)
    const size = lerp(heroSlot.size, landingSlot.size, effectiveMoveT)

    placeCube(left, top, size)

    return effectiveMoveT
  }

  const updateMorphPhase = (pinProgress, morphDone) => {
    setMorphExpand(pinProgress)

    if (morphDone) {
      if (!morphComplete) {
        setText(true)
        setMorphComplete(true)
      }
      return
    }

    if (morphComplete) setMorphComplete(false)
    setText(true)
  }

  const update = () => {
    const introRect = intro.getBoundingClientRect()
    const track = intro.querySelector('.intro-pin__track')
    const trackHeight = track ? track.offsetHeight : intro.offsetHeight
    const vh = window.innerHeight
    const travelT = getTravelT(introRect, vh)

    const pinScrollable = Math.max(1, trackHeight - vh)
    const pinProgress =
      introRect.top <= 0 ? clamp(-introRect.top / pinScrollable, 0, 1) : 0

    const expand = clamp(
      (pinProgress - MORPH_PIN_START) / (MORPH_PIN_END - MORPH_PIN_START),
      0,
      1,
    )
    const morphDone = pinProgress >= SENS_MORPH_END

    if (travelT <= TRAVEL_OFF) {
      if (travelActive) {
        const targetT = mapFlightProgress(Math.max(travelT, 0))
        const moveT = advanceTravelT(targetT)
        const isReturning = true
        const effectiveMoveT = applyFlightTransform(moveT, vh, isReturning)

        if (canFinishReturn(effectiveMoveT, vh, travelT)) {
          finishReturnToHero()
        }

        if (morphComplete) {
          setMorphComplete(false)
          setText(false)
        }

        updateCta(vh)
        return
      }

      syncRestingCube()

      if (morphComplete) {
        setMorphComplete(false)
        setText(false)
      }

      updateCta(vh)
      return
    }

    const targetT = mapFlightProgress(travelT)
    const isReturning = targetT < smoothTravelT - 0.0005
    const moveT = advanceTravelT(targetT, travelT >= 1)
    applyFlightTransform(moveT, vh, isReturning)

    if (travelT >= 1) {
      updateMorphPhase(pinProgress, morphDone)
      updateCta(vh)
      return
    }

    if (morphComplete) setMorphComplete(false)
    setMorphExpand(0)
    setText(shouldShowIntroText(travelT, vh))
    updateCta(vh)
  }

  const onResize = () => {
    measureRestWidths()

    if (getTravelT(intro.getBoundingClientRect(), window.innerHeight) <= TRAVEL_OFF) {
      if (travelActive && canFinishReturn(smoothTravelT, window.innerHeight, 0)) {
        finishReturnToHero()
      }
      setMorphComplete(false)
      setText(false)
    }

    update()
  }

  const measureRestWidths = () => {
    if (!morphTitle || restNodes.length === 0) return

    const prevExpandSense = morphTitle.style.getPropertyValue('--expand-sense')
    const prevExpandSens = morphTitle.style.getPropertyValue('--expand-sensibility')
    const wasVisible = morphTitle.classList.contains('is-visible')
    const wasComplete = morphTitle.classList.contains('is-morph-complete')

    morphTitle.classList.add('is-visible', 'is-measuring')
    morphTitle.classList.remove('is-morph-complete')
    morphTitle.style.setProperty('--expand-sense', '1')
    morphTitle.style.setProperty('--expand-sensibility', '1')

    restNodes.forEach((el) => {
      el.style.maxWidth = 'none'
      el.style.opacity = '1'
      const width = Math.ceil(el.getBoundingClientRect().width) + 6
      el.style.maxWidth = ''
      el.style.opacity = ''
      el.style.setProperty('--rest-width', `${width}px`)
    })

    morphTitle.classList.remove('is-measuring')
    morphTitle.classList.toggle('is-visible', wasVisible)
    morphTitle.classList.toggle('is-morph-complete', wasComplete)

    if (prevExpandSense || prevExpandSens) {
      if (prevExpandSense) morphTitle.style.setProperty('--expand-sense', prevExpandSense)
      if (prevExpandSens) morphTitle.style.setProperty('--expand-sensibility', prevExpandSens)
    } else {
      morphTitle.style.removeProperty('--expand-sense')
      morphTitle.style.removeProperty('--expand-sensibility')
    }
  }

  measureRestWidths()
  smoothTravelT = mapFlightProgress(getTravelT(intro.getBoundingClientRect(), window.innerHeight))

  if (document.fonts?.ready) {
    document.fonts.ready.then(measureRestWidths)
  }

  onScroll(update)
  update()

  window.addEventListener('resize', onResize)
  window.addEventListener('load', () => {
    smoothTravelT = mapFlightProgress(getTravelT(intro.getBoundingClientRect(), window.innerHeight))
    update()
  })
}
