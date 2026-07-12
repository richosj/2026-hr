import { HERO_DESKTOP_QUERY } from './breakpoints.js'
import { resetHeroCubeRotation } from './hero-cube.js'
import { getLenis, onScroll } from './smooth-scroll.js'

const CUBE_END_SIZE = 240
const DESKTOP_QUERY = HERO_DESKTOP_QUERY
const DESKTOP_CUBE_SIZE = 500
const MOBILE_CUBE_SIZE = 320
const MORPH_PIN_START = 0.1
const MORPH_PIN_END = 0.55
const TRAVEL_OFF = 0.008
const FLIGHT_SMOOTH = 0.14

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
  const heroComponent = document.getElementById('heroComponent')
  const heroStage = document.getElementById('heroStage')
  const intro = document.getElementById('intro-hss')
  const landing = document.getElementById('cubeLanding')
  const eyebrow = document.getElementById('introEyebrow')
  const morphTitle = document.getElementById('introMorphTitle')
  const heroCta = document.getElementById('heroCta')
  const cubeSlot = document.getElementById('heroCubeSlot')

  if (!cube || !cubeWrapper || !heroComponent || !heroStage || !intro || !landing || !cubeSlot) return

  const restNodes = morphTitle
    ? [...morphTitle.querySelectorAll('.morph-item__rest')]
    : []

  let morphComplete = false
  let travelActive = false
  let smoothTravelT = 0

  const isDesktopLayout = () => window.matchMedia(DESKTOP_QUERY).matches
  const getStartSize = () => (isDesktopLayout() ? DESKTOP_CUBE_SIZE : MOBILE_CUBE_SIZE)

  const getHeroSlotRect = () => {
    const size = getStartSize()
    const slotRect = cubeSlot.getBoundingClientRect()

    return {
      left: slotRect.left + (slotRect.width - size) / 2,
      top: slotRect.top + (slotRect.height - size) / 2,
      size,
    }
  }

  const getLandingSlot = () => {
    const landingRect = landing.getBoundingClientRect()

    return {
      left: landingRect.left + (landingRect.width - CUBE_END_SIZE) / 2,
      top: landingRect.top + (landingRect.height - CUBE_END_SIZE) / 2,
      size: CUBE_END_SIZE,
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

  const resetCubeToHero = () => {
    travelActive = false
    cubeWrapper.classList.remove('is-traveling')
    clearFlightStyles()
    resetHeroCubeRotation()
  }

  /** viewport 기준 left/top/size만 갱신 — DOM은 절대 안 옮김 */
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

  /** heroStage 하단을 넘지 않도록 fixed bottom만 clamp (모드 전환 없음 → 떨림 방지) */
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

  const resetIntroState = () => {
    smoothTravelT = 0
    resetCubeToHero()
    setMorphComplete(false)
    setText(false, 0)
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
      if (travelActive || morphComplete) {
        resetIntroState()
      }
      updateCta(stageRect, vh, false)
      return
    }

    const heroSlot = getHeroSlotRect()
    const landingSlot = getLandingSlot()
    const targetT = easeInOutCubic(travelT)

    smoothTravelT += (targetT - smoothTravelT) * FLIGHT_SMOOTH
    if (travelT >= 1) {
      smoothTravelT = Math.max(smoothTravelT, targetT)
    }

    const t = smoothTravelT
    const moveT = travelT >= 1 ? 1 : t
    const left = lerp(heroSlot.left, landingSlot.left, moveT)
    const top = lerp(heroSlot.top, landingSlot.top, moveT)
    const size = lerp(heroSlot.size, landingSlot.size, moveT)

    placeCube(left, top, size)

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
      resetIntroState()
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
