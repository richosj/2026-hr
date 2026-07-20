import { onScroll } from './smooth-scroll.js'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function createCharSpan(char, charIndex) {
  const span = document.createElement('span')
  span.className = 'char'
  span.dataset.char = char
  span.style.setProperty('--char-index', String(charIndex))
  span.style.setProperty('--reveal', '0')
  span.textContent = char
  return span
}

function appendSplitText(text, parent, state) {
  const parts = text.split(/(\s+)/).filter((part) => part.length > 0)

  parts.forEach((part) => {
    if (/^\s+$/.test(part)) {
      parent.appendChild(document.createTextNode(part))
      return
    }

    const word = document.createElement('span')
    word.className = 'word'
    word.dataset.word = part
    word.style.setProperty('--word-index', String(state.wordIndex))
    Array.from(part).forEach((char) => {
      word.appendChild(createCharSpan(char, state.charIndex))
      state.charIndex += 1
    })
    parent.appendChild(word)
    state.wordIndex += 1
  })
}

function cloneSplitNode(node, parent, state) {
  if (node.nodeType === Node.TEXT_NODE) {
    appendSplitText(node.textContent, parent, state)
    return
  }

  if (node.nodeName === 'BR') {
    parent.appendChild(node.cloneNode(true))
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const el = node.cloneNode(false)
  Array.from(node.childNodes).forEach((child) => cloneSplitNode(child, el, state))
  parent.appendChild(el)
}

function wrapLine(element, { splitClass = 'words chars splitting', lineClass } = {}) {
  const sourceNodes = Array.from(element.childNodes)
  const split = document.createElement('span')
  split.className = splitClass

  const state = { charIndex: 0, wordIndex: 0 }
  sourceNodes.forEach((node) => cloneSplitNode(node, split, state))

  split.style.setProperty('--char-total', String(state.charIndex))
  split.style.setProperty('--word-total', String(state.wordIndex))

  if (lineClass) element.classList.add(lineClass)
  element.replaceChildren(split)

  return Array.from(split.querySelectorAll('.char'))
}

/**
 * scroll-type #1: 흐린 글자 위에 스크롤로 선명해지는 char 리빌
 *
 * softWindow: 글자당 페이드 폭 (1=딱딱한 한 글자씩, 클수록 부드럽게 겹쳐 차오름)
 * revealStartRatio / revealEndRatio: 스크롤 구간 — 간격이 클수록 느리게 참
 * progressTarget: 진행률 측정 요소 (기본=target). 섹션 도착 기준으로 맞출 때 사용
 */
function bindCharReveal(target, {
  lineSelector,
  splitClass,
  lineClass,
  revealStartRatio = 0.9,
  revealEndRatio = 0.28,
  softWindow = 1,
  progressTarget,
  onProgress,
} = {}) {
  if (!target || target.dataset.splitReady === 'true') return null

  const lines = lineSelector
    ? Array.from(target.querySelectorAll(lineSelector))
    : [target]

  const chars = lines.flatMap((line) =>
    wrapLine(line, { splitClass, lineClass }),
  )

  if (chars.length === 0) return null

  target.dataset.splitReady = 'true'

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const windowSize = Math.max(1, softWindow)
  const measureEl = progressTarget || target

  const update = () => {
    const vh = window.innerHeight
    const rect = measureEl.getBoundingClientRect()
    const revealStart = vh * revealStartRatio
    const revealEnd = vh * revealEndRatio
    const progress = clamp((revealStart - rect.top) / Math.max(1, revealStart - revealEnd), 0, 1)
    const total = chars.length

    onProgress?.(progress, rect, revealStart)

    if (reduceMotion) {
      chars.forEach((char) => char.style.setProperty('--reveal', '1'))
      return
    }

    // softWindow만큼 겹쳐 차오르게 → 덜 끊기고 스무스
    const span = total + windowSize - 1
    chars.forEach((char, index) => {
      const reveal = clamp((progress * span - index) / windowSize, 0, 1)
      char.style.setProperty('--reveal', String(reveal))
    })
  }

  onScroll(update)
  update()
  window.addEventListener('resize', update)

  return update
}

export function initMessageScrollReveal() {
  const copy = document.querySelector('.message-copy')
  bindCharReveal(copy, {
    lineSelector: 'p',
    splitClass: 'message-copy__split words chars splitting',
    lineClass: 'message-copy__line',
    // 스크롤 구간 넓히고 softWindow로 부드럽게
    revealStartRatio: 0.95,
    revealEndRatio: 0.05,
    softWindow: 6,
    onProgress: (_progress, rect, revealStart) => {
      document.body.classList.toggle('is-message-bg', rect.top <= revealStart)
    },
  })

  const detailCopy = document.querySelector('.message-detail__copy')
  const detailSection = document.getElementById('message-detail')
  bindCharReveal(detailCopy, {
    lineSelector: 'p',
    splitClass: 'message-detail__split words chars splitting',
    lineClass: 'message-detail__line',
    // 섹션이 뷰포트에 들어온 뒤 첫 문장부터 천천히 채움
    progressTarget: detailSection,
    revealStartRatio: 0.78,
    revealEndRatio: -0.05,
    softWindow: 8,
  })

  const registerTitle = document.querySelector('.register__title')
  const registerSection = document.getElementById('apply')
  bindCharReveal(registerTitle, {
    lineSelector: '.register__line',
    splitClass: 'register__split words chars splitting',
    // 섹션 도착 후 시작, 스크롤 구간을 넓혀 천천히 채움
    progressTarget: registerSection,
    revealStartRatio: 0.8,
    revealEndRatio: 0.25,
    softWindow: 5,
  })
}
