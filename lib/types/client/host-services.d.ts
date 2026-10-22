import type { Sessions } from './conversation';
/**
 * The client context `apply` receives — only the members this plugin uses.
 *
 * Host services are not part of the required surface: each host adapter enters
 * them through an optional `ctx.inject([...])` child, so a host without canvas
 * or slots loads the plugin exactly as before.
 */
export interface ClientContext {
    effect(callback: () => () => void, label?: string): void;
    inject(deps: string[], callback: (ctx: ClientContext & HostServices) => void): unknown;
    get(name: string): unknown;
    sessions: Sessions;
}
/** Host services a chart panel can be mounted into. */
export interface HostServices {
    /** The host slot registry; canvas and paper-trading both render panels through it. */
    slots?: SlotsService;
    /** The free-canvas service, present only when the canvas plugin is loaded. */
    canvas?: CanvasService;
}
/** The slice of the host `slots` service this plugin registers into. */
export interface SlotsService {
    inject(name: string, factory: () => unknown): unknown;
    register(options: {
        name: string;
        key?: string;
        id?: string;
        order?: number;
        label?: string;
    }, component: unknown): () => void;
}
/** The slice of the host free-canvas service this plugin registers into. */
export interface CanvasService {
    registerType(descriptor: CanvasPanelType): () => void;
}
/** The panel type descriptor a canvas accepts. */
export interface CanvasPanelType {
    typeId: string;
    title?: string;
    icon?: string;
    category?: string;
    description?: string;
    defaultSize?: {
        w: number;
        h: number;
    };
    singleton?: boolean;
    order?: number;
    channels?: {
        publishes?: string[];
        consumes?: string[];
        provides?: string[];
    };
}
