/** Subset of `IndexingProgressResponse` used for display helpers (avoids importing the API module). */
export type IndexingProgressFields = {
    scanned: number;
    total: number;
    status: 'idle' | 'running' | 'complete' | 'error';
    error_message?: string | null;
};

/** Display width 0–100 for a determinate progress bar; null when unknown / indeterminate. */
export function indexingProgressPercent(scanned: number, total: number): number | null {
    if (total <= 0) return null;
    return Math.min(100, Math.round((100 * scanned) / total));
}

/** User-visible line under the progress bar. */
export function indexingProgressCaption(progress: IndexingProgressFields | undefined): string {
    if (!progress) return 'Preparing project context…';
    if (progress.status === 'error') {
        return progress.error_message?.trim() || 'Indexing failed.';
    }
    if (progress.status === 'idle' && progress.scanned === 0 && progress.total === 0) {
        return 'Preparing project context…';
    }
    if (progress.total <= 0) {
        if (progress.status === 'complete') return 'Nothing new to index.';
        return 'Scanning content…';
    }
    return `${progress.scanned}/${progress.total} pieces indexed`;
}
