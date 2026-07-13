import { HERO_DESKTOP_QUERY } from './breakpoints.js'
import { getLenis, onScroll } from './smooth-scroll.js'

const DESKTOP_QUERY = HERO_DESKTOP_QUERY
const MOBILE_CUBE_VH = 0.25
const DESKTOP_CUBE_VH = 0.4
const CUBE_END_VH = 0.25
const MORPH_PIN_START = 0.1
const MORPH_PIN_END = 0.55
const TRAVEL_OFF = 0.008
const FLIGHT_SMOOTH = 0.14
const RETURN_SMOOTH = 0.35
const RETURN_DONE = 0.004

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function getScrollY() {
  return getLenis()?.scroll ?? window.scrollY ?? 0
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

  if (!cube || !cubeWrapper || !heroStage || !intro || !landing || !cubeSlot) return

  const restNodes = morphTitle
    ? [...morphTitle.querySelectorAll('.morph-item__rest')]
    : []

  let morphComplete = false
  let travelActive = false
  let smoothTravelT = 0

  const isDesktopLayout = () => window.matchMedia(DESKTOP_QUERY).matches

  const getFallbackStartSize = () =>
    window.innerHeight * (isDesktopLayout() ? DESKTOP_CUBE_VH : MOBILE_CUBE_VH)

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
    const varName = isDesktopLayout() ? '--hero-cube-size-desktop' : '--hero-cube-size'
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
  }

  const finishReturnToHero = () => {
    travelActive = false
    smoothTravelT = 0
    cubeWrapper.classList.remove('is-traveling')
    clearFlightStyles()
  }

  const placeCube = (left, top, size) => {
    const px = Math.round(size)

    if (!travelActive) {
      travelActive = true
      cubeWrapper.classList.add('is-traveling')
    }

    cubeWrapper.style.left = `${left}px`
    cubeWrapper.style.top = `${top}px`
    cubeWrapper.style.width = `${px}px`
    cubeWrapper.style.height = `${px}px`
    cubeWrapper.style.transform = 'translate3d(0, 0, 0)'
    cube.style.width = `${px}px`
    cube.style.height = `${px}px`
    cube.style.setProperty('--cube-size', `${px}px`)
  }

  const updateCta = (stageRect, vh, accent) => {
    if (!heroCta) return

    if (stageRect.bottom <= 0) {
      heroCta.classList.remove('is-active', 'is-accent')
      heroCta.style.bottom = ''
      return
    }

    const bottom = Math.max(0, Math.round(vh - stageRect.bottom))

    heroCta.classList.add('is-active')
    heroCta.classList.toggle('is-accent', accent)
    heroCta.style.bottom = `${bottom}px`
  }

  const setMorphComplete = (complete) => {
    morphComplete = complete
    if (!morphTitle) return

    morphTitle.classList.toggle('is-morph-complete', complete)

    if (complete) {
      morphTitle.style.setProperty('--expand', '1')
      return
    }

    morphTitle.style.removeProperty('--expand')
  }

  const setText = (showTitle, expand) => {
    if (eyebrow) eyebrow.classList.toggle('is-visible', showTitle)
    if (!morphTitle || morphComplete) return

    morphTitle.classList.toggle('is-visible', showTitle)
    morphTitle.style.setProperty('--expand', String(expand))
    morphTitle.setAttribute(
      'aria-label',
      expand > 0.5 ? 'Human Sense, Sensibility' : 'HSS',
    )
  }

  const getTravelT = (introRect, vh) => {
    if (getScrollY() < 8) return 0

    const flightStart = vh * 0.78
    const flightEnd = vh * 0.22

    if (introRect.top >= flightStart) return 0
    if (introRect.top <= flightEnd) return 1

    return clamp((flightStart - introRect.top) / (flightStart - flightEnd), 0, 1)
  }

  const advanceTravelT = (targetT, atLanding = false) => {
    const smoothing = targetT < smoothTravelT ? RETURN_SMOOTH : FLIGHT_SMOOTH
    smoothTravelT += (targetT - smoothTravelT) * smoothing

    if (atLanding) {
      smoothTravelT = Math.max(smoothTravelT, targetT)
    }

    return smoothTravelT
  }

  const applyFlightTransform = (moveT) => {
    const heroSlot = getLiveHeroSlot()
    const landingSlot = getLandingSlot()
    const left = lerp(heroSlot.left, landingSlot.left, moveT)
    const top = lerp(heroSlot.top, landingSlot.top, moveT)
    const size = lerp(heroSlot.size, landingSlot.size, moveT)

    placeCube(left, top, size)
  }

  const updateMorphPhase = (expandEased, morphDone) => {
    if (morphDone) {
      if (!morphComplete) {
        setText(true, 1)
        setMorphComplete(true)
      }
      return
    }

    if (morphComplete) setMorphComplete(false)
    setText(true, expandEased)
  }

  const update = () => {
    const introRect = intro.getBoundingClientRect()
    const stageRect = heroStage.getBoundingClientRect()
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
    const expandEased = easeInOutCubic(expand)
    const morphDone = expand >= 1
    const ctaAccent = travelT >= 1 || morphDone

    if (travelT <= TRAVEL_OFF) {
      if (travelActive) {
        const targetT = easeInOutCubic(Math.max(travelT, 0))
        const moveT = advanceTravelT(targetT)
        applyFlightTransform(moveT)

        if (moveT <= RETURN_DONE) {
          finishReturnToHero()
        }

        if (morphComplete) {
          setMorphComplete(false)
          setText(false, 0)
        }

        updateCta(stageRect, vh, false)
        return
      }

      if (morphComplete) {
        setMorphComplete(false)
        setText(false, 0)
      }

      updateCta(stageRect, vh, false)
      return
    }

    const targetT = easeInOutCubic(travelT)
    const moveT = advanceTravelT(targetT, travelT >= 1)
    applyFlightTransform(moveT)

    if (travelT >= 1) {
      updateMorphPhase(expandEased, morphDone)
      updateCta(stageRect, vh, ctaAccent)
      return
    }

    if (morphComplete) setMorphComplete(false)
    setText(false, 0)
    updateCta(stageRect, vh, ctaAccent)
  }

  const onResize = () => {
    measureRestWidths()

    if (getTravelT(intro.getBoundingClientRect(), window.innerHeight) <= TRAVEL_OFF) {
      if (travelActive) {
        finishReturnToHero()
      }
      setMorphComplete(false)
      setText(false, 0)
    }

    update()
  }

  const measureRestWidths = () => {
    if (!morphTitle || restNodes.length === 0) return

    const prevExpand = morphTitle.style.getPropertyValue('--expand')
    const wasVisible = morphTitle.classList.contains('is-visible')
    const wasComplete = morphTitle.classList.contains('is-morph-complete')

    morphTitle.classList.add('is-visible', 'is-measuring')
    morphTitle.classList.remove('is-morph-complete')
    morphTitle.style.setProperty('--expand', '1')

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

    if (prevExpand) {
      morphTitle.style.setProperty('--expand', prevExpand)
    } else {
      morphTitle.style.removeProperty('--expand')
    }
  }

  measureRestWidths()
  smoothTravelT = easeInOutCubic(getTravelT(intro.getBoundingClientRect(), window.innerHeight))

  if (document.fonts?.ready) {
    document.fonts.ready.then(measureRestWidths)
  }

  onScroll(update)
  update()

  window.addEventListener('resize', onResize)
  window.addEventListener('load', () => {
    smoothTravelT = easeInOutCubic(getTravelT(intro.getBoundingClientRect(), window.innerHeight))
    update()
  })
}
