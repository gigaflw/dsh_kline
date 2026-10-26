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
    /** DSH's own right-Sidebar tab registry, present on hosts that own that column. */
    sidebarRightTabs?: SidebarRightTabsService;
    /** DSH's own right-Sidebar navigation face, the way a page type is opened. */
    sidebarRight?: SidebarRightService;
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
        /** Business props for the body; the framework adds its own standard share. */
        inject?: (...args: any[]) => Record<string, unknown>;
    }, component: unknown): () => void;
}
/** One tab type as DSH's native right Sidebar registry takes it (the members this plugin sets). */
export interface NativeSidebarTabDefinition {
    /** Implementation identity, unique across registrations; the body seat dispatches by it. */
    id: string;
    /** Type discriminator — what `openTab` names and what every tab of this type is. */
    kind: string;
    /** `extension` is the band for a type shipped outside the product, which is this one. */
    priority?: 'extension' | 'builtin' | 'fallback';
    /** The chip text captured when a tab of this type opens. */
    title: (address: string) => string;
    /** Entry boxes the host's guide page offers for opening this type. */
    guide?: readonly NativeSidebarGuideEntry[];
}
/** One guide entry: a capsule that opens this tab type when picked. */
export interface NativeSidebarGuideEntry {
    id: string;
    order: number;
    title: () => string;
    description?: () => string;
}
/** The slice of the host right-Sidebar tab registry this plugin registers into. */
export interface SidebarRightTabsService {
    register(definition: NativeSidebarTabDefinition): () => void;
}
/** The slice of the host right-Sidebar navigation face this plugin uses. */
export interface SidebarRightService {
    openTab(kind: string, options?: {
        params?: unknown;
    }): void;
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
