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

function wrapParagraph(paragraph) {
  const sourceNodes = Array.from(paragraph.childNodes)
  const split = document.createElement('span')
  split.className = 'message-copy__split words chars splitting'

  const state = { charIndex: 0, wordIndex: 0 }
  sourceNodes.forEach((node) => cloneSplitNode(node, split, state))

  split.style.setProperty('--char-total', String(state.charIndex))
  split.style.setProperty('--word-total', String(state.wordIndex))

  paragraph.classList.add('message-copy__line')
  paragraph.replaceChildren(split)

  return Array.from(split.querySelectorAll('.char'))
}

/**
 * scroll-type #1: 흐린 글자 위에 스크롤로 선명해지는 char 리빌 (단일 레이어 — 겹침 없음)
 */
export function initMessageScrollReveal() {
  const section = document.getElementById('message')
  const copy = document.querySelector('.message-copy')
  if (!section || !copy || copy.dataset.splitReady === 'true') return

  const chars = copy.querySelectorAll('p').length
    ? Array.from(copy.querySelectorAll('p')).flatMap(wrapParagraph)
    : []

  if (chars.length === 0) return

  copy.dataset.splitReady = 'true'

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const REVEAL_START_RATIO = 0.9
  const REVEAL_END_RATIO = 0.28

  const update = () => {
    const vh = window.innerHeight
    const rect = copy.getBoundingClientRect()
    const revealStart = vh * REVEAL_START_RATIO
    const revealEnd = vh * REVEAL_END_RATIO
    const progress = clamp((revealStart - rect.top) / Math.max(1, revealStart - revealEnd), 0, 1)
    const total = chars.length

    document.body.classList.toggle('is-message-bg', rect.top <= revealStart)

    if (reduceMotion) {
      chars.forEach((char) => char.style.setProperty('--reveal', '1'))
      return
    }

    chars.forEach((char, index) => {
      const reveal = clamp(progress * total - index, 0, 1)
      char.style.setProperty('--reveal', String(reveal))
    })
  }

  onScroll(update)
  update()
  window.addEventListener('resize', update)
}
