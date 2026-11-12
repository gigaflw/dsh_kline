/**
 * Host services a chart panel can be mounted into.
 *
 * Only the slot registry is named here: the canvas panel adapter is maintained
 * on its own branch and carries its own canvas types, so this module stays a
 * single-slot surface. Host services are never required — each host adapter
 * enters them through an optional `ctx.inject([...])` child, so a host without
 * the slot loads the plugin exactly as before.
 */
import type { Sessions } from './conversation';
/**
 * The client context `apply` receives — only the members this plugin uses.
 *
 * `inject` hands its child the host services that scope provides, which is why
 * this is not the same shape as `./client-context`: the plugin entry declares
 * `sessions` only, while a panel needs the services it is mounted into.
 */
export interface ClientContext {
    effect(callback: () => () => void, label?: string): void;
    inject(deps: string[], callback: (ctx: ClientContext & HostServices) => void): unknown;
    get(name: string): unknown;
    sessions: Sessions;
}
/** Host services a chart panel can be mounted into. */
export interface HostServices {
    /** The host slot registry; the paper-trading rail renders panels through it. */
    slots?: SlotsService;
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
