export declare const ONBOARDING_KEY = "dsh-kline:onboarding-version:v2";
export declare function hasPreviousUsage(storage: Storage): boolean;
export declare function captureOnboarding(storage?: Storage): void;
export declare function onboardingKind(storage?: Storage): 'upgrade' | 'none';
/**
 * Only a returning user gets a one-time notice.
 *
 * A fresh install gets no dialog at all: the chart opens straight into its
 * workspace, because the first-run welcome that used to pitch the FTShare key
 * is gone.
 */
export declare function classifyOnboarding(storage: Storage, previousUsage: boolean): 'upgrade' | 'none';
export declare function acknowledgeOnboarding(storage?: Storage): void;
