import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef } from 'react';
import { StandaloneKlineApp } from './KlineContent';
/** Panel type registered into a host that provides the free-canvas `canvas` service. */
export const KLINE_CANVAS_TYPE = 'ft.kline.chart';
/** Slot the canvas renders a panel body through, keyed by panel type. */
const CANVAS_PANEL_SLOT = 'ftCanvas.panel.body';
/** Channel carrying the instrument a canvas panel should show. */
const INSTRUMENT_CHANNEL = 'instrument';
/**
 * One chart panel on the free canvas.
 *
 * The canvas hands over its public owner props only, so this component never
 * imports the canvas implementation: the selected instrument arrives on the
 * `instrument` channel and the chart's own selection is published back on the
 * same channel. The chart body is the very component the sidebar tab renders,
 * which is what keeps the two visually identical.
 */
export function KlineCanvasPanel({ owner }) {
    // The canvas rebuilds `owner` on every render, while the chart view keeps its
    // identity callback in an effect dependency: hold the owner in a ref so a bus
    // update can never remount (and reload) the chart.
    const ownerRef = useRef(owner);
    ownerRef.current = owner;
    const publishIdentity = useCallback((symbol, name) => {
        if (symbol === undefined || symbol === '')
            return;
        ownerRef.current?.publish(INSTRUMENT_CHANNEL, { symbol, name });
    }, []);
    if (owner === undefined)
        return null;
    const instrument = owner.resolve(INSTRUMENT_CHANNEL);
    const panelId = owner.instance === undefined ? 'chart' : owner.instance.id;
    // Follow the canvas palette instead of pinning dark, so a light canvas does
    // not host a dark chart. Older canvases have no `colorScheme` and stay dark.
    const theme = typeof owner.colorScheme === 'function' ? owner.colorScheme() : 'dark';
    return (_jsx(StandaloneKlineApp, { conversationId: 'canvas:' + panelId, embedded: true, chrome: "chart", theme: theme, symbol: instrument?.symbol, name: instrument?.name, onIdentity: publishIdentity }));
}
/** Register the chart panel type and its body, only when the host has a canvas. */
export function registerCanvasHost(ctx) {
    ctx.inject(['slots', 'canvas'], scope => {
        const slots = scope.slots;
        const canvas = scope.canvas;
        if (slots === undefined || canvas === undefined)
            return;
        scope.effect(() => canvas.registerType({
            typeId: KLINE_CANVAS_TYPE,
            title: 'K 线',
            icon: '📈',
            category: '行情',
            description: '与侧边栏同一渲染器',
            defaultSize: { w: 900, h: 620 },
            order: 40,
            channels: { publishes: [INSTRUMENT_CHANNEL], consumes: [INSTRUMENT_CHANNEL] },
        }), 'dsh-kline: canvas panel type');
        slots.inject(CANVAS_PANEL_SLOT, () => slots.register({ name: CANVAS_PANEL_SLOT, key: KLINE_CANVAS_TYPE }, KlineCanvasPanel));
    });
}
