import { useSyncExternalStore } from 'react'
import { useChartReference } from './chart-session-resolver'
import { KlineTabContent } from './BetterSidebarTab'
import type { Sessions } from './conversation'
import { InterfaceContext, readAutoOpen, readDisplayMode } from './mode-preferences'
import { KLINE_TAB_ID } from './sidebar-integration'
import { NATIVE_TAB_ID, nativeTabDefinition } from './native-sidebar-contract'
import type { ClientContext, SidebarRightService, SidebarRightTabsService, SlotsService } from './host-services'
export { NATIVE_TAB_ID, nativeTabDefinition, nativeTabDescription } from './native-sidebar-contract'

/**
 * The chart as a tab of the host's own right column.
 *
 * A DSH host that owns its right Sidebar publishes two faces: `ctx.sidebarRightTabs`
 * (stage one — what the tab type is, and its guide entry) and the keyed
 * `sidebar.right.pane.tab` seat (stage two — the body), navigated by
 * `ctx.sidebarRight.openTab`. Registering there means the chart needs no
 * third-party sidebar to get a tab, so this bridge is tried before the
 * Better Sidebar one in index.tsx.
 *
 * The two stages are deliberately registered as one unit: a type without a body
 * would show the host's "nothing can view this" notice, so a failed body
 * registration rolls the type back and leaves `available()` false, which makes
 * the router fall back to the next interface it knows.
 */

/** The metadata hook the host seat binds into every tab body. */
export interface NativeTabInfo {
  tab: { readonly visible: boolean }
}

/** What the body seat hands a registered body: its session and the host services it needs. */
export interface NativeTabBodyProps {
  readonly sessionId: string
  readonly sessions: Sessions
  readonly useTabInfo: () => NativeTabInfo
}

/**
 * One tab body: the same chart the Better Sidebar tab and the paper-trading
 * panel draw, mounted against the tab's own conversation.
 *
 * The interface state is the native-tab one: the chart view uses it only to
 * know which shell it lives in, so the tab reports `better-sidebar` (the
 * existing "native tab" value) and stays independent of the user's preference.
 */
export function NativeKlineTabBody({ sessionId, sessions, useTabInfo }: NativeTabBodyProps) {
  const visible = useTabInfo().tab.visible
  return (
    <InterfaceContext.Provider value={{ preference: readDisplayMode(), mode: 'better-sidebar', available: true }}>
      <div data-dsh-kline-tab="" style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
        {visible && <KlineTabContent key={sessionId} sessions={sessions} conversationId={sessionId} />}
      </div>
    </InterfaceContext.Provider>
  )
}

/** Reveal the chart tab when an analysis result lands in the conversation on screen. */
function NativeAutoOpen({ sessions, conversationId, bridge }: { sessions: Sessions; conversationId: string; bridge: NativeSidebarBridge }) {
  useChartReference(sessions, conversationId, () => { if (readAutoOpen()) bridge.open() })
  return null
}

/** Auto-open lives in the tab's own session, exactly like the Better Sidebar path. */
export function NativeSidebarBridgeView({ bridge, sessions }: { bridge: NativeSidebarBridge; sessions: Sessions }) {
  const list = useSyncExternalStore(
    listener => sessions.list.subscribe(listener),
    () => sessions.list.getSnapshot(),
  )
  return list.current
    ? <NativeAutoOpen key={list.current} bridge={bridge} sessions={sessions} conversationId={list.current} />
    : null
}

/** The host-facing handle the router polls to decide which interface to draw. */
export interface NativeSidebarBridge {
  /** Whether the host registered both stages; false falls back to the next interface. */
  available(): boolean
  /** Open (or reveal) the chart tab of the session on screen. */
  open(): void
}

/**
 * Register the chart tab into the host's native right Sidebar.
 *
 * Every host service is optional: a host without `sidebarRightTabs`, `sidebarRight`
 * or `slots` simply gets `available() === false` and the plugin keeps working
 * through the interfaces it does have.
 * @param ctx - the client context to register on.
 * @param onChange - called whenever availability changes, so the router repaints.
 * @returns the handle the router and the auto-open path share.
 */
export function registerNativeSidebar(ctx: ClientContext, onChange: () => void): NativeSidebarBridge {
  let registry: SidebarRightTabsService | undefined
  let navigation: SidebarRightService | undefined
  const bridge: NativeSidebarBridge = {
    available: () => registry !== undefined,
    open: () => {
      try { navigation?.openTab(KLINE_TAB_ID) } catch {
        // A host with no Session on screen has nothing to open into; the next
        // analysis result or the guide entry opens it then.
      }
    },
  }
  ctx.inject(['sidebarRightTabs', 'sidebarRight', 'slots'], scope => {
    scope.effect(() => {
      const tabs = scope.get('sidebarRightTabs') as SidebarRightTabsService | undefined
      const column = scope.get('sidebarRight') as SidebarRightService | undefined
      const slots = scope.slots as SlotsService | undefined
      if (tabs === undefined || column === undefined || slots === undefined) return () => {}
      const disposers: (() => void)[] = []
      let disposeType: (() => void) | undefined
      try {
        disposeType = tabs.register(nativeTabDefinition())
        disposers.push(slots.inject('sidebar.right.pane.tab', () => slots.register({
          name: 'sidebar.right.pane.tab',
          key: NATIVE_TAB_ID,
          inject: (sessionId: string) => ({ sessions: ctx.sessions, sessionId }),
        }, NativeKlineTabBody)) as () => void)
      } catch (error) {
        // A half-registered type would show the host's empty-pane notice: back
        // both stages out and let the router choose another interface.
        for (const dispose of disposers.reverse()) dispose()
        disposeType?.()
        console.error('[dsh-kline] native right sidebar registration failed:', error)
        return () => {}
      }
      registry = tabs
      navigation = column
      onChange()
      return () => {
        registry = undefined
        navigation = undefined
        for (const dispose of disposers.reverse()) dispose()
        disposeType?.()
        onChange()
      }
    }, 'dsh-kline: native right sidebar tab')
  })
  return bridge
}
