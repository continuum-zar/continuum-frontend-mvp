import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { Mutation, Query } from '@tanstack/react-query';
import { toast } from 'sonner';
import { onMutationCacheError, onQueryCacheError } from './globalQueryErrors';

vi.mock('sonner', () => ({
    toast: { error: vi.fn() },
}));

function makeHttpError(status: number): AxiosError {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    return new AxiosError(
        `Request failed with status code ${status}`,
        undefined,
        config,
        {},
        { status, statusText: '', data: { code: String(status), message: '' }, headers: {}, config } as AxiosResponse,
    );
}

type AnyQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

function makeQuery(opts: { data?: unknown; meta?: Record<string, unknown> } = {}): AnyQuery {
    return {
        meta: opts.meta,
        state: { data: opts.data },
    } as unknown as AnyQuery;
}

function makeMutation(
    opts: { onError?: () => void; meta?: Record<string, unknown> } = {},
): Mutation<unknown, unknown, unknown, unknown> {
    return {
        meta: opts.meta,
        options: { onError: opts.onError },
    } as unknown as Mutation<unknown, unknown, unknown, unknown>;
}

beforeEach(() => {
    vi.mocked(toast.error).mockClear();
});

describe('onQueryCacheError', () => {
    it('toasts once for a cold failing query, with a stable dedup id', () => {
        const err = makeHttpError(500);
        onQueryCacheError(err, makeQuery());
        onQueryCacheError(err, makeQuery());
        expect(toast.error).toHaveBeenCalledTimes(2);
        const [, firstOpts] = vi.mocked(toast.error).mock.calls[0];
        const [, secondOpts] = vi.mocked(toast.error).mock.calls[1];
        expect((firstOpts as { id: string }).id).toBe((secondOpts as { id: string }).id);
    });

    it('skips background refetch failures when cached data is still shown', () => {
        onQueryCacheError(makeHttpError(500), makeQuery({ data: [{ id: 1 }] }));
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('skips 401s (owned by the axios refresh/logout flow)', () => {
        onQueryCacheError(makeHttpError(401), makeQuery());
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('skips canceled requests', () => {
        onQueryCacheError(new CanceledError('canceled'), makeQuery());
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('respects meta.suppressGlobalErrorToast', () => {
        onQueryCacheError(makeHttpError(500), makeQuery({ meta: { suppressGlobalErrorToast: true } }));
        expect(toast.error).not.toHaveBeenCalled();
    });
});

describe('onMutationCacheError', () => {
    it('toasts for a mutation without a local onError', () => {
        onMutationCacheError(makeHttpError(500), undefined, undefined, makeMutation());
        expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('skips mutations with a local onError (local handler owns the UX)', () => {
        onMutationCacheError(makeHttpError(500), undefined, undefined, makeMutation({ onError: () => {} }));
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('respects meta.suppressGlobalErrorToast', () => {
        onMutationCacheError(
            makeHttpError(500),
            undefined,
            undefined,
            makeMutation({ meta: { suppressGlobalErrorToast: true } }),
        );
        expect(toast.error).not.toHaveBeenCalled();
    });
});
