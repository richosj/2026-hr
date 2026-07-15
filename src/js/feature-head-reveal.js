/**
 * feature 헤더·카드 — 뷰포트 진입 시 slide up
 */
export function initFeatureHeadReveal() {
  const targets = document.querySelectorAll('.feature__head, .feature-card')
  if (!targets.length) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    targets.forEach((target) => target.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -8% 0px',
    },
  )

  targets.forEach((target) => observer.observe(target))
}
