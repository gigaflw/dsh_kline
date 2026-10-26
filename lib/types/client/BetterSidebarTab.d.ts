import type { BetterSidebarService } from 'dsh-better-sidebar';
import type { Sessions } from './conversation';
/** The chart itself, shared by every host tab: Better Sidebar and the native one. */
export declare function KlineTabContent({ sessions, conversationId }: {
    sessions: Sessions;
    conversationId?: string;
}): import("react").JSX.Element;
export declare function BetterSidebarBridge({ service, sessions }: {
    service: BetterSidebarService;
    sessions: Sessions;
}): import("react").JSX.Element | null;
