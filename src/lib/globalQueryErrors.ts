import axios from 'axios';
import { toast } from 'sonner';
import type { Mutation, Query } from '@tanstack/react-query';
import { isStaleClientChunkError } from './staleClientChunk';
import { describeErrorForToast, isCanceledError } from './errorMessages';

/**
 * Global safety net for query/mutation errors that no component handles
 * locally. Wired into the QueryClient in main.tsx via QueryCache/MutationCache
 * onError. Convention: a mutation either handles errors in its own `onError`
 * or lets this handler toast — never both.
 */

declare module '@tanstack/react-query' {
    interface Register {
        queryMeta: { suppressGlobalErrorToast?: boolean };
        mutationMeta: { suppressGlobalErrorToast?: boolean };
    }
}

type AnyQuery = Query<unknown, unknown, unknown, readonly unknown[]>;
type AnyMutation = Mutation<unknown, unknown, unknown, unknown>;

function isAuthError(error: unknown): boolean {
    // The axios interceptor owns 401s (token refresh / forced logout) — never toast over it.
    return axios.isAxiosError(error) && error.response?.status === 401;
}

function isSilenced(error: unknown): boolean {
    return isCanceledError(error) || isStaleClientChunkError(error) || isAuthError(error);
}

function showErrorToast(error: unknown): void {
    const { message, description, id } = describeErrorForToast(error);
    toast.error(message, { id, description });
}

export function shouldToastQueryError(error: unknown, query: AnyQuery): boolean {
    if (isSilenced(error)) return false;
    if (query.meta?.suppressGlobalErrorToast) return false;
    // Warm cache means the user still sees data; a background refetch failing
    // (flaky 4G) is not worth a toast — the next refetch will heal it.
    if (query.state.data !== undefined) return false;
    return true;
}

export function shouldToastMutationError(error: unknown, mutation: AnyMutation): boolean {
    if (isSilenced(error)) return false;
    if (mutation.meta?.suppressGlobalErrorToast) return false;
    // A local onError owns the UX (most existing mutations toast there already).
    if (mutation.options.onError != null) return false;
    return true;
}

export function onQueryCacheError(error: unknown, query: AnyQuery): void {
    if (shouldToastQueryError(error, query)) showErrorToast(error);
}

export function onMutationCacheError(
    error: unknown,
    _variables: unknown,
    _context: unknown,
    mutation: AnyMutation,
): void {
    if (shouldToastMutationError(error, mutation)) showErrorToast(error);
}
