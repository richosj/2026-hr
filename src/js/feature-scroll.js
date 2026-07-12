import { getLenis, onScroll } from './smooth-scroll.js'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function segmentLinear(progress, start, end) {
  return clamp((progress - start) / (end - start), 0, 1)
}

function segmentEase(progress, start, end) {
  return easeInOutCubic(segmentLinear(progress, start, end))
}

/**
 * Human Sense → Sensibility pin
 * #message 세로 중간쯤부터 효과 시작
 */
export function initFeatureScroll() {
  const section = document.getElementById('human-sense')
  const message = document.getElementById('message')
  if (!section) return

  const track = section.querySelector('.feature-pin__track')
  const sticky = section.querySelector('.feature-pin__sticky')
  const senseHead = section.querySelector('[data-feature-head="sense"]')
  const sensHead = section.querySelector('[data-feature-head="sensibility"]')
  const senseCards = [...section.querySelectorAll('[data-feature-card="sense"]')]
  const sensCards = [...section.querySelectorAll('[data-feature-card="sensibility"]')]

  if (!track || !sticky) return

  const senseLabel = senseHead?.querySelector('.feature__label') ?? null
  const senseTitle = senseHead?.querySelector('.feature__title') ?? null
  const sensLabel = sensHead?.querySelector('.feature__label') ?? null
  const sensTitle = sensHead?.querySelector('.feature__title') ?? null

  const headParts = [senseLabel, senseTitle, sensLabel, sensTitle]
  const cards = [...senseCards, ...sensCards]

  const setFlipHidden = (el) => {
    if (!el) return
    el.style.setProperty('--part-show', '0')
    el.style.setProperty('--part-flip-y', '76deg')
    el.style.setProperty('--part-z', '-36px')
    el.style.setProperty('--part-scale', '0.965')
    el.style.visibility = 'hidden'
    el.style.pointerEvents = 'none'
  }

  const setFlipVisible = (el) => {
    if (!el) return
    el.style.setProperty('--part-show', '1')
    el.style.setProperty('--part-flip-y', '0deg')
    el.style.setProperty('--part-z', '0px')
    el.style.setProperty('--part-scale', '1')
    el.style.visibility = 'visible'
    el.style.pointerEvents = 'auto'
  }

  const setFlipPart = (el, linearReveal, flipOut = false) => {
    if (!el) return

    const t = easeInOutCubic(clamp(linearReveal, 0, 1))
    const arc = Math.sin(t * Math.PI)

    if (flipOut) {
      el.style.setProperty('--part-show', String(1 - t))
      el.style.setProperty('--part-flip-y', `${-t * 76}deg`)
      el.style.setProperty('--part-z', `${-arc * 36}px`)
      el.style.setProperty('--part-scale', String(1 - t * 0.035))
    } else {
      el.style.setProperty('--part-show', String(t))
      el.style.setProperty('--part-flip-y', `${(1 - t) * 76}deg`)
      el.style.setProperty('--part-z', `${(1 - arc) * -36}px`)
      el.style.setProperty('--part-scale', String(0.965 + t * 0.035))
    }

    el.style.visibility = flipOut
      ? t < 0.98 ? 'visible' : 'hidden'
      : t > 0.02 ? 'visible' : 'hidden'
    el.style.pointerEvents = flipOut || t < 0.9 ? 'none' : 'auto'
  }

  const setCard = (el, linearReveal, flipOut = false) => {
    if (!el) return

    const t = easeInOutCubic(clamp(linearReveal, 0, 1))
    const arc = Math.sin(t * Math.PI)

    if (flipOut) {
      el.style.setProperty('--reveal', String(1 - t))
      el.style.setProperty('--flip-y', `${-t * 76}deg`)
      el.style.setProperty('--depth', `${-arc * 36}px`)
      el.style.setProperty('--scale', String(1 - t * 0.035))
    } else {
      el.style.setProperty('--reveal', String(t))
      el.style.setProperty('--flip-y', `${(1 - t) * 76}deg`)
      el.style.setProperty('--depth', `${(1 - arc) * -42}px`)
      el.style.setProperty('--scale', String(0.965 + t * 0.035))
    }

    el.style.visibility = flipOut
      ? t < 0.98 ? 'visible' : 'hidden'
      : t > 0.02 ? 'visible' : 'hidden'
    el.style.pointerEvents = !flipOut && t > 0.9 ? 'auto' : 'none'
  }

  const getPinProgress = () => {
    const vh = window.innerHeight
    const scroll = getLenis()?.scroll ?? window.scrollY
    const trackHeight = track.offsetHeight
    const pinScrollable = Math.max(1, trackHeight - vh)
    const sectionRect = section.getBoundingClientRect()
    const sectionDocumentTop = scroll + sectionRect.top

    let progressOrigin = sectionDocumentTop - vh * 0.5

    if (message) {
      const messageMid = message.offsetTop + message.offsetHeight * 0.5
      progressOrigin = messageMid - vh * 0.35
    }

    const pinEnd = sectionDocumentTop + pinScrollable
    const totalRange = Math.max(1, pinEnd - progressOrigin)

    return clamp((scroll - progressOrigin) / totalRange, 0, 1)
  }

  const resetFeatureState = () => {
    headParts.forEach(setFlipHidden)
    cards.forEach(setFlipHidden)
    sticky.style.setProperty('--enter', '0')
    sticky.style.setProperty('--phase-mix', '0')
    section.dataset.phase = 'sense'
  }

  const updateHead = (progress) => {
    const senseLabelIn = segmentEase(progress, 0.04, 0.1)
    const senseTitleIn = segmentEase(progress, 0.09, 0.16)

    const labelCrossOut = segmentLinear(progress, 0.46, 0.53)
    const labelCrossIn = segmentLinear(progress, 0.48, 0.55)
    const titleCrossOut = segmentLinear(progress, 0.54, 0.61)
    const titleCrossIn = segmentLinear(progress, 0.56, 0.63)

    const headCrossMix = segmentEase(progress, 0.46, 0.63)

    if (labelCrossOut > 0.001) {
      setFlipPart(senseLabel, labelCrossOut, true)
    } else if (progress < 0.46) {
      setFlipPart(senseLabel, senseLabelIn, false)
    } else {
      setFlipHidden(senseLabel)
    }

    if (labelCrossIn > 0.001) {
      setFlipPart(sensLabel, labelCrossIn, false)
    } else if (progress >= 0.55) {
      setFlipVisible(sensLabel)
    } else {
      setFlipHidden(sensLabel)
    }

    if (titleCrossOut > 0.001) {
      setFlipPart(senseTitle, titleCrossOut, true)
    } else if (progress < 0.54) {
      setFlipPart(senseTitle, senseTitleIn, false)
    } else {
      setFlipHidden(senseTitle)
    }

    if (titleCrossIn > 0.001) {
      setFlipPart(sensTitle, titleCrossIn, false)
    } else if (progress >= 0.63) {
      setFlipVisible(sensTitle)
    } else {
      setFlipHidden(sensTitle)
    }

    sticky.style.setProperty('--phase-mix', String(headCrossMix))
    section.dataset.phase = headCrossMix > 0.55 ? 'sensibility' : 'sense'
  }

  const update = () => {
    const progress = getPinProgress()

    if (progress <= 0.001) {
      resetFeatureState()
      return
    }

    const enter = segmentEase(progress, 0, 0.1)

    sticky.style.setProperty('--enter', String(enter))
    updateHead(progress)

    const senseCard1In = segmentLinear(progress, 0.14, 0.3)
    const senseCard2In = segmentLinear(progress, 0.3, 0.46)
    const senseCard1Out = segmentLinear(progress, 0.54, 0.7)
    const senseCard2Out = segmentLinear(progress, 0.68, 0.86)

    const sensCard1In = segmentLinear(progress, 0.56, 0.72)
    const sensCard2In = segmentLinear(progress, 0.7, 0.88)

    if (senseCard1Out > 0.001) {
      setCard(senseCards[0], senseCard1Out, true)
    } else {
      setCard(senseCards[0], senseCard1In, false)
    }

    if (senseCard2Out > 0.001) {
      setCard(senseCards[1], senseCard2Out, true)
    } else {
      setCard(senseCards[1], senseCard2In, false)
    }

    setCard(sensCards[0], sensCard1In, false)
    setCard(sensCards[1], sensCard2In, false)
  }

  onScroll(update)
  update()

  window.addEventListener('resize', update)
}
