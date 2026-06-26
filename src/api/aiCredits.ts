import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { STALE_MODERATE_MS } from '@/lib/queryDefaults';

/** Shape returned by `GET /users/me/ai-credits`. 1 credit = $0.001 of LLM spend. */
export interface AICredits {
    /** Current spendable credits. */
    balance: number;
    /** Credits granted each month (default 5000). */
    monthly_quota: number;
    /** ISO 8601 timestamp when the balance next resets (UTC). */
    reset_at: string;
    /** ISO 8601 timestamp of the last reset, or null if never reset. */
    last_reset_at?: string | null;
    /** Convenience flag: true when `balance` is 0. */
    exhausted: boolean;
}

export const aiCreditKeys = {
    me: ['ai-credits', 'me'] as const,
};

export async function fetchMyAICredits(): Promise<AICredits> {
    const { data } = await api.get<AICredits>('/users/me/ai-credits');
    return data;
}

/**
 * Current user's AI credit balance. Refetches on window focus so the badge and
 * any "AI disabled" states stay reasonably fresh after spending elsewhere.
 */
export function useAICredits() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: aiCreditKeys.me,
        queryFn: fetchMyAICredits,
        enabled: isAuthenticated && userId != null && userId !== '',
        staleTime: STALE_MODERATE_MS,
        refetchOnWindowFocus: true,
    });
}

/**
 * Whether the user may currently start an AI action.
 *
 * Optimistic by design: while the balance is still loading (or the request
 * failed) we return `true` so we never block AI features on a transient error —
 * the backend still enforces the limit and returns 402 if truly exhausted.
 */
export function useHasAICredits(): boolean {
    const { data } = useAICredits();
    return data ? !data.exhausted : true;
}
