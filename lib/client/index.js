import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { ClassicShell } from './ClassicShell';
import { BetterSidebarBridge } from './BetterSidebarTab';
import { NativeSidebarBridgeView, registerNativeSidebar } from './native-sidebar';
import { isSidebarUsable } from './sidebar-integration';
import { InterfaceContext, readDisplayMode, resolveDisplayMode } from './mode-preferences';
import { captureOnboarding } from './ui-onboarding';
import { registerCanvasHost } from './canvas-panel';
import { registerPaperTradingHost } from './PaperKlinePanel';
export const inject = ['sessions'];
export function apply(ctx) {
    let service;
    const listeners = new Set();
    const emit = () => listeners.forEach(listener => listener());
    const subscribe = (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
    const preference = readDisplayMode();
    captureOnboarding();
    // Registered before the router paints, so the first frame already knows
    // whether the host owns a right column this plugin can tab into.
    const native = registerNativeSidebar(ctx, emit);
    function Router() {
        const sidebar = useSyncExternalStore(subscribe, () => service);
        const nativeTab = useSyncExternalStore(subscribe, () => native.available());
        const available = nativeTab || isSidebarUsable(sidebar);
        const mode = resolveDisplayMode(preference, available);
        return _jsxs(InterfaceContext.Provider, { value: { preference, mode, available }, children: [nativeTab && _jsx(NativeSidebarBridgeView, { bridge: native, sessions: ctx.sessions }), !nativeTab && sidebar && _jsx(BetterSidebarBridge, { service: sidebar, sessions: ctx.sessions }), mode === 'classic' && _jsx(ClassicShell, { sessions: ctx.sessions })] });
    }
    ctx.effect(() => {
        const host = document.createElement('div');
        host.dataset.dshKlineRouter = '';
        document.body.appendChild(host);
        const root = createRoot(host);
        root.render(_jsx(Router, {}));
        return () => { root.unmount(); host.remove(); listeners.clear(); };
    }, 'dsh-kline: interface router');
    // A separate dependency scope does not block the parent when absent.
    ctx.inject(['betterSidebar'], scoped => {
        scoped.effect(() => {
            service = scoped.get('betterSidebar');
            emit();
            return () => { service = undefined; emit(); };
        }, 'dsh-kline: optional sidebar');
    });
    // Optional host panels. Each registers through its own optional scope, so a
    // host without the canvas or the paper-trading slot keeps today's plugin.
    registerCanvasHost(ctx);
    registerPaperTradingHost(ctx);
}
