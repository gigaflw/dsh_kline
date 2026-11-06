import type { ClientContext } from './host-services';
/** Panel type registered into a host that provides the free-canvas `canvas` service. */
export declare const KLINE_CANVAS_TYPE = "ft.kline.chart";
/** The transparent per-instance data the canvas hands to a panel body. */
interface CanvasPanelInstance {
    id: string;
    typeId: string;
    title: string;
}
/** Only the public owner props this panel consumes. */
export interface CanvasPanelOwner {
    instance?: CanvasPanelInstance;
    publish(channel: string, value: unknown): void;
    resolve(channel: string): unknown;
    read(channel: string): unknown;
    /** Host day/night, when the canvas is new enough to expose it. */
    colorScheme?(): 'light' | 'dark';
}
/**
 * One chart panel on the free canvas.
 *
 * The canvas hands over its public owner props only, so this component never
 * imports the canvas implementation: the selected instrument arrives on the
 * `instrument` channel and the chart's own selection is published back on the
 * same channel. The chart body is the very component the sidebar tab renders,
 * which is what keeps the two visually identical.
 */
export declare function KlineCanvasPanel({ owner }: {
    owner?: CanvasPanelOwner;
}): import("react").JSX.Element | null;
/** Register the chart panel type and its body, only when the host has a canvas. */
export declare function registerCanvasHost(ctx: ClientContext): void;
export {};
