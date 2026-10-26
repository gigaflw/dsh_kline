import { jsx as _jsx } from "react/jsx-runtime";
import { useSyncExternalStore } from 'react';
import { useChartReference } from './chart-session-resolver';
import { KlineTabContent } from './BetterSidebarTab';
import { InterfaceContext, readAutoOpen, readDisplayMode } from './mode-preferences';
import { KLINE_TAB_ID } from './sidebar-integration';
import { NATIVE_TAB_ID, nativeTabDefinition } from './native-sidebar-contract';
export { NATIVE_TAB_ID, nativeTabDefinition, nativeTabDescription } from './native-sidebar-contract';
/**
 * One tab body: the same chart the Better Sidebar tab and the paper-trading
 * panel draw, mounted against the tab's own conversation.
 *
 * The interface state is the native-tab one: the chart view uses it only to
 * know which shell it lives in, so the tab reports `better-sidebar` (the
 * existing "native tab" value) and stays independent of the user's preference.
 */
export function NativeKlineTabBody({ sessionId, sessions, useTabInfo }) {
    const visible = useTabInfo().tab.visible;
    return (_jsx(InterfaceContext.Provider, { value: { preference: readDisplayMode(), mode: 'better-sidebar', available: true }, children: _jsx("div", { "data-dsh-kline-tab": "", style: { width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }, children: visible && _jsx(KlineTabContent, { sessions: sessions, conversationId: sessionId }, sessionId) }) }));
}
/** Reveal the chart tab when an analysis result lands in the conversation on screen. */
function NativeAutoOpen({ sessions, conversationId, bridge }) {
    useChartReference(sessions, conversationId, () => { if (readAutoOpen())
        bridge.open(); });
    return null;
}
/** Auto-open lives in the tab's own session, exactly like the Better Sidebar path. */
export function NativeSidebarBridgeView({ bridge, sessions }) {
    const list = useSyncExternalStore(listener => sessions.list.subscribe(listener), () => sessions.list.getSnapshot());
    return list.current
        ? _jsx(NativeAutoOpen, { bridge: bridge, sessions: sessions, conversationId: list.current }, list.current)
        : null;
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
export function registerNativeSidebar(ctx, onChange) {
    let registry;
    let navigation;
    const bridge = {
        available: () => registry !== undefined,
        open: () => {
            try {
                navigation?.openTab(KLINE_TAB_ID);
            }
            catch {
                // A host with no Session on screen has nothing to open into; the next
                // analysis result or the guide entry opens it then.
            }
        },
    };
    ctx.inject(['sidebarRightTabs', 'sidebarRight', 'slots'], scope => {
        scope.effect(() => {
            const tabs = scope.get('sidebarRightTabs');
            const column = scope.get('sidebarRight');
            const slots = scope.slots;
            if (tabs === undefined || column === undefined || slots === undefined)
                return () => { };
            const disposers = [];
            let disposeType;
            try {
                disposeType = tabs.register(nativeTabDefinition());
                disposers.push(slots.inject('sidebar.right.pane.tab', () => slots.register({
                    name: 'sidebar.right.pane.tab',
                    key: NATIVE_TAB_ID,
                    inject: (sessionId) => ({ sessions: ctx.sessions, sessionId }),
                }, NativeKlineTabBody)));
            }
            catch (error) {
                // A half-registered type would show the host's empty-pane notice: back
                // both stages out and let the router choose another interface.
                for (const dispose of disposers.reverse())
                    dispose();
                disposeType?.();
                console.error('[dsh-kline] native right sidebar registration failed:', error);
                return () => { };
            }
            registry = tabs;
            navigation = column;
            onChange();
            return () => {
                registry = undefined;
                navigation = undefined;
                for (const dispose of disposers.reverse())
                    dispose();
                disposeType?.();
                onChange();
            };
        }, 'dsh-kline: native right sidebar tab');
    });
    return bridge;
}
