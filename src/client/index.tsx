import { useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import type { BetterSidebarService } from 'dsh-better-sidebar'
import { ClassicShell } from './ClassicShell'
import { BetterSidebarBridge } from './BetterSidebarTab'
import { NativeSidebarBridgeView, registerNativeSidebar } from './native-sidebar'
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
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
  const preference = readDisplayMode()
  captureOnboarding()
  // Registered before the router paints, so the first frame already knows
  // whether the host owns a right column this plugin can tab into.
  const native = registerNativeSidebar(ctx, emit)
  function Router() {
    const sidebar = useSyncExternalStore(subscribe, () => service)
    const nativeTab = useSyncExternalStore(subscribe, () => native.available())
    const available = nativeTab || isSidebarUsable(sidebar)
    const mode = resolveDisplayMode(preference, available)
    return <InterfaceContext.Provider value={{ preference, mode, available }}>
      {/* The host's own column first: it needs no third-party sidebar. */}
      {nativeTab && <NativeSidebarBridgeView bridge={native} sessions={ctx.sessions} />}
      {!nativeTab && sidebar && <BetterSidebarBridge service={sidebar} sessions={ctx.sessions} />}
      {/* The classic floating K is no longer drawn. It survives only as the
          fallback for a host that offers no right column at all, otherwise the
          chart would have no entry there. */}
      {mode === 'classic' && <ClassicShell sessions={ctx.sessions} />}
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

