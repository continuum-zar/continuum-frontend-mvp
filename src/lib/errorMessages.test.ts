import { describe, expect, it } from 'vitest';
import { AxiosError, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
    GENERIC_ERROR_MESSAGE,
    describeErrorForToast,
    getUserErrorMessage,
    isLikelyRawServerErrorText,
    sanitizeDisplayText,
} from './errorMessages';

function makeAxiosError(opts: {
    status?: number;
    data?: unknown;
    code?: string;
    message?: string;
    headers?: Record<string, string>;
}): AxiosError {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const response =
        opts.status != null
            ? ({
                  status: opts.status,
                  statusText: '',
                  data: opts.data,
                  headers: opts.headers ?? {},
                  config,
              } as AxiosResponse)
            : undefined;
    return new AxiosError(
        opts.message ?? `Request failed with status code ${opts.status ?? 0}`,
        opts.code,
        config,
        {},
        response,
    );
}

describe('getUserErrorMessage', () => {
    it('returns the backend message verbatim for 4xx errors', () => {
        const err = makeAxiosError({
            status: 403,
            data: { code: 'PROJECT_ACCESS_DENIED', message: 'You are not a member of this project.' },
        });
        expect(getUserErrorMessage(err)).toBe('You are not a member of this project.');
    });

    it('never shows backend body content for 5xx errors', () => {
        const err = makeAxiosError({
            status: 500,
            data: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
        });
        expect(getUserErrorMessage(err)).toBe(
            'Something went wrong on our end. Please try again in a moment.',
        );
    });

    it('joins pydantic detail messages for 422 errors', () => {
        const err = makeAxiosError({
            status: 422,
            data: {
                code: 'VALIDATION_ERROR',
                message: 'body.name: field required; body.email: value is not a valid email address',
                details: [
                    { loc: ['body', 'name'], msg: 'field required' },
                    { loc: ['body', 'email'], msg: 'value is not a valid email address' },
                ],
            },
        });
        expect(getUserErrorMessage(err)).toBe(
            'field required. value is not a valid email address',
        );
    });

    it('falls back to generic validation copy for 422 without details', () => {
        const err = makeAxiosError({ status: 422, data: { code: 'VALIDATION_ERROR', message: '' } });
        expect(getUserErrorMessage(err)).toBe(
            'Some of the information provided is invalid. Please review and try again.',
        );
    });

    it('still resolves legacy FastAPI detail shapes', () => {
        const asString = makeAxiosError({ status: 400, data: { detail: 'Project name is taken.' } });
        expect(getUserErrorMessage(asString)).toBe('Project name is taken.');

        const asArray = makeAxiosError({
            status: 400,
            data: { detail: [{ msg: 'Invalid project id.' }] },
        });
        expect(getUserErrorMessage(asArray)).toBe('Invalid project id.');
    });

    it('maps network failures to offline copy, never raw axios messages', () => {
        const err = makeAxiosError({ code: 'ERR_NETWORK', message: 'Network Error' });
        const message = getUserErrorMessage(err);
        expect(message).not.toBe('Network Error');
        expect(message).toMatch(/offline|connection/i);
    });

    it('maps timeouts to timeout copy, never raw axios messages', () => {
        const err = makeAxiosError({ code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' });
        const message = getUserErrorMessage(err);
        expect(message).not.toContain('timeout of 30000ms');
        expect(message).toMatch(/taking longer than expected/i);
    });

    it('handles proxy HTML bodies (502) without crashing or leaking HTML', () => {
        const err = makeAxiosError({ status: 502, data: '<html><body>Bad Gateway</body></html>' });
        expect(getUserErrorMessage(err)).toBe(
            'Something went wrong on our end. Please try again in a moment.',
        );
    });

    it('uses friendly status copy when a 4xx has no usable body', () => {
        expect(getUserErrorMessage(makeAxiosError({ status: 404, data: '' }))).toBe(
            "We couldn't find what you were looking for.",
        );
        expect(getUserErrorMessage(makeAxiosError({ status: 429, data: '' }))).toMatch(/wait a moment/i);
    });

    it('preserves hand-thrown friendly Error messages', () => {
        const err = new Error('Branch was created on the remote but linking failed. Try again.');
        expect(getUserErrorMessage(err)).toBe(
            'Branch was created on the remote but linking failed. Try again.',
        );
    });

    it('blocks technical runtime errors and returns the fallback', () => {
        const err = new TypeError("Cannot read properties of undefined (reading 'map')");
        expect(getUserErrorMessage(err, 'Could not load tasks.')).toBe('Could not load tasks.');
        expect(getUserErrorMessage(new Error('Failed to fetch'))).toBe(GENERIC_ERROR_MESSAGE);
    });

    it('blocks Firefox and Safari TypeError wording (task-assistant incident)', () => {
        // Firefox: seen verbatim in the AI task assistant when a non-API 200 body crashed the client.
        const firefox = new TypeError('can\'t access property "length", res.tasks is undefined');
        expect(getUserErrorMessage(firefox, 'Could not generate tasks.')).toBe(
            'Could not generate tasks.',
        );
        expect(getUserErrorMessage(new TypeError('res.tasks is undefined'))).toBe(
            GENERIC_ERROR_MESSAGE,
        );
        // Safari wording for the same class of crash.
        expect(
            getUserErrorMessage(
                new TypeError("undefined is not an object (evaluating 'res.tasks.length')"),
            ),
        ).toBe(GENERIC_ERROR_MESSAGE);
    });

    it('returns the fallback for canceled requests', () => {
        expect(getUserErrorMessage(new CanceledError('canceled'), 'fallback')).toBe('fallback');
    });

    it('defaults the fallback to the generic message', () => {
        expect(getUserErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE);
        expect(getUserErrorMessage({ weird: true })).toBe(GENERIC_ERROR_MESSAGE);
    });
});

describe('describeErrorForToast', () => {
    it('includes the correlation id as description for 5xx errors', () => {
        const err = makeAxiosError({
            status: 500,
            data: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
            headers: { 'x-request-id': 'abc-123' },
        });
        const result = describeErrorForToast(err);
        expect(result.description).toBe('Error ID: abc-123');
        expect(result.id).toBe(`err:${result.message}`);
    });

    it('omits the correlation id for 4xx errors', () => {
        const err = makeAxiosError({
            status: 404,
            data: { code: '404', message: 'Task not found.', correlation_id: 'abc-123' },
        });
        expect(describeErrorForToast(err).description).toBeUndefined();
    });
});

describe('isLikelyRawServerErrorText', () => {
    it('flags a leaked SQLAlchemy/psycopg2 error returned as an answer body', () => {
        const leaked =
            'psycopg2.errors.UndefinedColumn) column project_embeddings.embedding_model does not exist\n' +
            'LINE 1: ...content_hash AS project_embeddings_content_hash, project_em...\n' +
            '[SQL: SELECT project_embeddings.content_hash ...]\n' +
            '(Background on this error at: https://sqlalche.me/e/20/f405)';
        expect(isLikelyRawServerErrorText(leaked)).toBe(true);
    });

    it('does not flag a normal AI answer', () => {
        expect(
            isLikelyRawServerErrorText('The project is on track; 3 tasks were completed this week.'),
        ).toBe(false);
    });

    it('ignores non-string values', () => {
        expect(isLikelyRawServerErrorText(undefined)).toBe(false);
        expect(isLikelyRawServerErrorText(null)).toBe(false);
        expect(isLikelyRawServerErrorText(42)).toBe(false);
    });
});

describe('sanitizeDisplayText', () => {
    const FALLBACK = 'Something went wrong.';

    it('returns the original text when it is safe', () => {
        const answer = 'Your project is 82% complete with 3 open tasks.';
        expect(sanitizeDisplayText(answer, FALLBACK)).toBe(answer);
    });

    it('replaces leaked SQL/DB error content with the fallback', () => {
        const leaked =
            '(psycopg2.errors.UndefinedColumn) column project_embeddings.embedding_model does not exist';
        expect(sanitizeDisplayText(leaked, FALLBACK)).toBe(FALLBACK);
    });

    it('replaces empty / non-string values with the fallback', () => {
        expect(sanitizeDisplayText('', FALLBACK)).toBe(FALLBACK);
        expect(sanitizeDisplayText('   ', FALLBACK)).toBe(FALLBACK);
        expect(sanitizeDisplayText(undefined, FALLBACK)).toBe(FALLBACK);
        expect(sanitizeDisplayText(null, FALLBACK)).toBe(FALLBACK);
    });
});
