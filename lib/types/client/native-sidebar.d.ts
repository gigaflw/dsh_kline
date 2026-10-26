import type { Sessions } from './conversation';
import type { ClientContext } from './host-services';
export { NATIVE_TAB_ID, nativeTabDefinition, nativeTabDescription } from './native-sidebar-contract';
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
    tab: {
        readonly visible: boolean;
    };
}
/** What the body seat hands a registered body: its session and the host services it needs. */
export interface NativeTabBodyProps {
    readonly sessionId: string;
    readonly sessions: Sessions;
    readonly useTabInfo: () => NativeTabInfo;
}
/**
 * One tab body: the same chart the Better Sidebar tab and the paper-trading
 * panel draw, mounted against the tab's own conversation.
 *
 * The interface state is the native-tab one: the chart view uses it only to
 * know which shell it lives in, so the tab reports `better-sidebar` (the
 * existing "native tab" value) and stays independent of the user's preference.
 */
export declare function NativeKlineTabBody({ sessionId, sessions, useTabInfo }: NativeTabBodyProps): import("react").JSX.Element;
/** Auto-open lives in the tab's own session, exactly like the Better Sidebar path. */
export declare function NativeSidebarBridgeView({ bridge, sessions }: {
    bridge: NativeSidebarBridge;
    sessions: Sessions;
}): import("react").JSX.Element | null;
/** The host-facing handle the router polls to decide which interface to draw. */
export interface NativeSidebarBridge {
    /** Whether the host registered both stages; false falls back to the next interface. */
    available(): boolean;
    /** Open (or reveal) the chart tab of the session on screen. */
    open(): void;
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
export declare function registerNativeSidebar(ctx: ClientContext, onChange: () => void): NativeSidebarBridge;
