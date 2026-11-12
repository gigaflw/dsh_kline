import type { ClientContext } from './host-services';
/**
 * Embeddable K-line workspace for the paper-trading panel.
 *
 * The host declares the `paperTrading.kline` slot and passes the selected
 * symbol plus an identity callback. dsh_kline owns the chart, its data source
 * and the in-chart search; selecting an instrument there updates the paper
 * ticket through `onIdentity`.
 */
export declare function PaperKlinePanel({ symbol, onIdentity }: {
    symbol?: string;
    onIdentity?: (symbol?: string, name?: string) => void;
}): import("react").JSX.Element;
/** Fill the paper-trading chart slot, only when the host declares it. */
export declare function registerPaperTradingHost(ctx: ClientContext): void;
