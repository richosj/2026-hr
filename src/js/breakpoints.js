/** Mobile 375–799 / Tablet 800–1269 / PC 1270–1920 */
export const BP_MOBILE_MIN = 375
export const BP_MOBILE_MAX = 799
export const BP_TABLET_MIN = 800
export const BP_TABLET_MAX = 1269
export const BP_DESKTOP_MIN = 1270
export const BP_DESKTOP_MAX = 1920

export const HERO_DESKTOP_MIN = BP_DESKTOP_MIN
export const HERO_DESKTOP_QUERY = `(min-width: ${HERO_DESKTOP_MIN}px)`

/** 큐브 hero 크기 — tablet(800+)부터 desktop과 동일(40vh) */
export const HERO_CUBE_LARGE_MIN = BP_TABLET_MIN
export const HERO_CUBE_LARGE_QUERY = `(min-width: ${HERO_CUBE_LARGE_MIN}px)`
