import type { NativeSidebarTabDefinition } from './host-services.ts';
/**
 * The static half of the native right-Sidebar integration.
 *
 * Kept free of JSX so the tests can import it directly: the registration itself
 * needs a host context, but what this plugin contributes — the tab kind, the
 * band it registers in, the chip title and the guide entry — is plain data.
 */
/** Implementation identity of the tab type; also the key its body registers under. */
export declare const NATIVE_TAB_ID = "ftshare-kline";
/**
 * The type definition this plugin contributes.
 *
 * A page type (no address `patterns`) is opened by kind, which is what the
 * auto-open path does; the guide entry is how a person reaches the chart from
 * the host's own "add tab" page. Both keep the product label separate from the
 * internal kind, exactly like the Better Sidebar title does.
 */
export declare function nativeTabDefinition(): NativeSidebarTabDefinition;
/** One line under the guide capsule: what picking it opens, in the host language. */
export declare function nativeTabDescription(locale?: string): string;
