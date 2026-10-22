import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef } from 'react';
import { StandaloneKlineApp } from './KlineContent';
/** Slot the paper-trading panel declares for the full chart. */
const PAPER_KLINE_SLOT = 'paperTrading.kline';
/**
 * Embeddable K-line workspace for the paper-trading panel.
 *
 * The host declares the `paperTrading.kline` slot and passes the selected
 * symbol plus an identity callback. dsh_kline owns the chart, its data source
 * and the in-chart search; selecting an instrument there updates the paper
 * ticket through `onIdentity`.
 */
export function PaperKlinePanel({ symbol, onIdentity }) {
    // The host may hand over a fresh callback per render; keep the chart's effect
    // dependencies stable through a ref so a re-render never remounts it.
    const identity = useRef(onIdentity);
    identity.current = onIdentity;
    const publishIdentity = useCallback((nextSymbol, name) => {
        identity.current?.(nextSymbol, name);
    }, []);
    return (_jsx("div", { className: "dsh-kline-paper-panel", "data-symbol": symbol ?? '', style: { width: '100%', height: '100%', minHeight: 360 }, children: _jsx(StandaloneKlineApp, { conversationId: "paper-trading", embedded: true, 
            // The rail keeps the symbol search (the chart owns it) and drops the
            // rest of the workspace, which belongs to the sidebar.
            chrome: "chart-search", symbol: symbol, onIdentity: publishIdentity }) }));
}
/** Fill the paper-trading chart slot, only when the host declares it. */
export function registerPaperTradingHost(ctx) {
    ctx.inject(['slots'], scope => {
        const slots = scope.slots;
        if (slots === undefined)
            return;
        slots.inject(PAPER_KLINE_SLOT, () => slots.register({ name: PAPER_KLINE_SLOT }, PaperKlinePanel));
    });
}
