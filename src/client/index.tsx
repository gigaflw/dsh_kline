import { useEffect, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import type { BetterSidebarService } from 'dsh-better-sidebar'
import { ClassicShell } from './ClassicShell'
import { BetterSidebarBridge } from './BetterSidebarTab'
import { isSidebarUsable } from './sidebar-integration'
import { InterfaceContext, readDisplayMode, resolveDisplayMode } from './mode-preferences'
import { captureOnboarding } from './ui-onboarding'
import { registerCanvasHost } from './canvas-panel'
import { registerPaperTradingHost } from './PaperKlinePanel'
import type { ClientContext } from './host-services'

export const inject = ['sessions']
export function apply(ctx: ClientContext) {
  let service: BetterSidebarService | undefined
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach(listener => listener())
  const preference = readDisplayMode()
  captureOnboarding()
  function Router() {
    const sidebar = useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, () => service)
    const hostHasRightSidebar = useHostRightSidebar()
    const available = isSidebarUsable(sidebar)
    const mode = resolveDisplayMode(preference, available)
    // Better Sidebar does not create a right-side container on the host's
    // New Session screen. Keep the classic K launcher there even when the
    // user prefers native tabs, so the plugin never loses its first entry.
    const showClassicLauncher = mode === 'classic' || !hostHasRightSidebar
    return <InterfaceContext.Provider value={{ preference, mode, available }}>
      {sidebar && <BetterSidebarBridge service={sidebar} sessions={ctx.sessions} />}
      {showClassicLauncher && <ClassicShell sessions={ctx.sessions} />}
    </InterfaceContext.Provider>
  }
  ctx.effect(() => {
    const host = document.createElement('div')
    host.dataset.dshKlineRouter = ''
    document.body.appendChild(host)
    const root = createRoot(host)
    root.render(<Router />)
    return () => { root.unmount(); host.remove(); listeners.clear() }
  }, 'dsh-kline: interface router')
  // A separate dependency scope does not block the parent when absent.
  ctx.inject(['betterSidebar'], scoped => {
    scoped.effect(() => {
      service = scoped.get('betterSidebar') as BetterSidebarService
      emit()
      return () => { service = undefined; emit() }
    }, 'dsh-kline: optional sidebar')
  })
  // Optional host panels. Each registers through its own optional scope, so a
  // host without the canvas or the paper-trading slot keeps today's plugin.
  registerCanvasHost(ctx)
  registerPaperTradingHost(ctx)
}

function hostRightSidebarAvailable(): boolean {
  const control = document.querySelector<HTMLElement>('[aria-label="Open right sidebar"], [aria-label="Collapse right sidebar"]')
  if (!control) return false
  const style = window.getComputedStyle(control)
  const bounds = control.getBoundingClientRect()
  return style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0
}

function useHostRightSidebar(): boolean {
  const [available, setAvailable] = useState(hostRightSidebarAvailable)
  useEffect(() => {
    const refresh = () => setAvailable(hostRightSidebarAvailable())
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return available
}
