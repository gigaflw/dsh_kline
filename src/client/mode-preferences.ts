import { createContext } from 'react'

export type DisplayMode = 'auto' | 'classic' | 'better-sidebar'
export const DISPLAY_MODE_KEY = 'dsh-kline:display-mode:v1'
export const AUTO_OPEN_KEY = 'dsh-kline:auto-open-after-analysis:v1'
export const UI_SEEN_KEY = 'dsh-kline:ui-change-seen:v0.2.0'
export interface InterfaceState { preference: DisplayMode; mode: Exclude<DisplayMode, 'auto'>; available: boolean }
export const InterfaceContext = createContext<InterfaceState>({ preference: 'classic', mode: 'classic', available: false })
export function readDisplayMode(storage = globalThis.localStorage): DisplayMode {
  try {
    const value = storage.getItem(DISPLAY_MODE_KEY)
    // The right-column tab is the default now that the classic K launcher is
    // gone; a stored preference is kept only so an older profile keeps reading.
    return value === 'classic' || value === 'better-sidebar' ? value : 'auto'
  } catch { return 'auto' }
}
export function resolveDisplayMode(_preference: DisplayMode, available: boolean): InterfaceState['mode'] {
  // A host with a right column always gets the tab: there is no floating
  // launcher left to fall back to, so a stored "classic" must not strand the
  // chart. The classic value survives only for a host that offers no right
  // column at all (see index.tsx, which then draws the classic shell).
  return available ? 'better-sidebar' : 'classic'
}
export function readAutoOpen(storage = globalThis.localStorage): boolean {
  try { return storage.getItem(AUTO_OPEN_KEY) !== 'false' } catch { return true }
}
