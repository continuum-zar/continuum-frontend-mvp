import { toast } from 'sonner';
import { GENERIC_ERROR_MESSAGE } from './errorMessages';
import { isStaleClientChunkError, tryReloadForStaleChunk } from './staleClientChunk';

/**
 * Last-resort handlers for errors that escape React, the query caches, and
 * the axios interceptors. Installed once from main.tsx.
 */

const TOAST_THROTTLE_MS = 10_000;
let lastUncaughtToastAt = 0;

function showThrottledGenericToast(): void {
    const now = Date.now();
    if (now - lastUncaughtToastAt < TOAST_THROTTLE_MS) return;
    lastUncaughtToastAt = now;
    // Fixed id: a burst of uncaught errors collapses into a single toast.
    toast.error(GENERIC_ERROR_MESSAGE, { id: 'global-uncaught-error' });
}

export function installGlobalErrorListeners(): void {
    window.addEventListener('error', (event) => {
        // Stale lazy chunks are owned by the reload flow, not a toast.
        if (isStaleClientChunkError(event.error)) {
            void tryReloadForStaleChunk();
            return;
        }
        // Cross-origin scripts surface as opaque "Script error." with no error
        // object; ResizeObserver loop warnings are benign browser noise.
        if (event.error == null) return;
        if (typeof event.message === 'string' && event.message.includes('ResizeObserver loop')) {
            return;
        }
        console.error('[uncaught error]', event.error);
        showThrottledGenericToast();
    });

    // Log only: user-action failures already surface via the query/mutation
    // caches, the axios interceptors, or the ErrorBoundary. Toasting here would
    // double-report those and false-alarm on fire-and-forget promises and
    // third-party SDK noise.
    window.addEventListener('unhandledrejection', (event) => {
        if (isStaleClientChunkError(event.reason)) {
            void tryReloadForStaleChunk();
            return;
        }
        console.error('[unhandledrejection]', event.reason);
    });
}
