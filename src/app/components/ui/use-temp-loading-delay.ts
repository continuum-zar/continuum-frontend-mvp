// TEMP (QA): force the branded loading placeholder for this long on every open of the
// project-level views, so the animation can be reviewed. Set to 0 to restore normal
// behavior, then delete this file and its call sites.
import { useEffect, useState } from 'react';

export const TEMP_LOADING_DELAY_MS = 5000;

/** TEMP (QA): true while the forced loading window is active after mount. */
export function useTempLoadingDelay(): boolean {
    const [tempLoading, setTempLoading] = useState(TEMP_LOADING_DELAY_MS > 0);
    useEffect(() => {
        if (TEMP_LOADING_DELAY_MS <= 0) return;
        const t = setTimeout(() => setTempLoading(false), TEMP_LOADING_DELAY_MS);
        return () => clearTimeout(t);
    }, []);
    return tempLoading;
}
