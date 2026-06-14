import axios, { AxiosError } from 'axios';
import { isStaleClientChunkError } from './staleClientChunk';

/**
 * Single source of truth for turning any thrown value into user-facing copy.
 * Raw axios/runtime messages ("Network Error", "Request failed with status
 * code 500", "timeout of 30000ms exceeded", TypeErrors) must never reach the
 * UI — they either map to the copy below or fall back to `fallback`.
 *
 * Backend error bodies follow app/schemas/common.ErrorResponse:
 * `{ code, message, correlation_id?, details? }` (see continuum-backend
 * error_handlers.py). `detail` is the legacy FastAPI shape, kept as a
 * secondary fallback for any straggler endpoint.
 */

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const TIMEOUT_MESSAGE =
    'This is taking longer than expected. Please check your connection and try again.';
const OFFLINE_MESSAGE =
    'You appear to be offline. Please check your internet connection and try again.';
const UNREACHABLE_MESSAGE = 'Could not reach the server. Please try again in a moment.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again in a moment.';
const VALIDATION_MESSAGE =
    'Some of the information provided is invalid. Please review and try again.';

const STATUS_MESSAGES: Record<number, string> = {
    400: "That request couldn't be processed. Please check your input and try again.",
    401: 'Your session has expired. Please sign in again.',
    402: "You've run out of AI credits. Your balance resets at the start of next month, or an admin can top you up.",
    403: "You don't have permission to perform this action.",
    404: "We couldn't find what you were looking for.",
    408: TIMEOUT_MESSAGE,
    409: 'This change conflicts with the current state. Refresh and try again.',
    422: VALIDATION_MESSAGE,
    429: "We're handling a lot of requests right now. Please wait a moment and try again.",
};

interface ApiErrorBody {
    code?: string;
    message?: string;
    correlation_id?: string;
    details?: Array<{ msg?: string; loc?: unknown[] }>;
    /** Legacy FastAPI shape, kept as secondary fallback. */
    detail?: string | Array<{ msg?: string }>;
}

function parseErrorBody(data: unknown): ApiErrorBody | undefined {
    // Proxy errors (nginx 502/504) return HTML strings — only trust plain objects.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as ApiErrorBody;
    }
    return undefined;
}

export function extractErrorCode(error: AxiosError): string | undefined {
    const code = parseErrorBody(error.response?.data)?.code;
    return typeof code === 'string' ? code : undefined;
}

/**
 * True when the backend rejected the request because the account's email has
 * not been verified (HTTP 403 with `{ code: "EMAIL_NOT_VERIFIED" }`). Callers
 * use this to route the user to the "check your email" page instead of
 * surfacing a generic permission error. See continuum-backend
 * app/api/deps.py:assert_email_verified.
 */
export function isEmailNotVerifiedError(err: unknown): boolean {
    return axios.isAxiosError(err) && extractErrorCode(err) === 'EMAIL_NOT_VERIFIED';
}

export function extractCorrelationId(error: AxiosError): string | undefined {
    const headerId = error.response?.headers?.['x-request-id'];
    if (typeof headerId === 'string' && headerId) return headerId;
    const id = parseErrorBody(error.response?.data)?.correlation_id;
    return typeof id === 'string' ? id : undefined;
}

/** Unknown-typed wrapper around {@link extractCorrelationId}. */
export function getErrorCorrelationId(err: unknown): string | undefined {
    return axios.isAxiosError(err) ? extractCorrelationId(err) : undefined;
}

/** Deliberate aborts (unmounts, superseded requests) — never worth telling the user about. */
export function isCanceledError(err: unknown): boolean {
    if (axios.isCancel(err)) return true;
    return err instanceof Error && err.name === 'AbortError';
}

/**
 * Messages that describe a runtime/transport failure rather than something a
 * user can act on. Hand-thrown copy (plain `new Error('Friendly text')`)
 * passes through; this only blocks technical junk.
 */
const TECHNICAL_MESSAGE_PATTERNS = [
    /^(TypeError|ReferenceError|SyntaxError|RangeError)\b/,
    /is not a function/,
    /Cannot read propert/,
    /Cannot access /,
    /is not defined$/,
    /Failed to fetch/,
    /NetworkError/i,
    /Network Error/,
    /Request failed with status code/,
    /timeout of \d+ms exceeded/,
    /Importing a module/,
    /dynamically imported module/,
    /Unexpected token/,
    /JSON\.parse/,
    /^\s*at\s/m,
];

function isTechnicalMessage(message: string): boolean {
    return TECHNICAL_MESSAGE_PATTERNS.some((p) => p.test(message));
}

/** Backend `message` is human-authored, but gate it against anything that slipped through. */
function isSafeBackendMessage(message: unknown): message is string {
    return (
        typeof message === 'string' &&
        message.trim().length > 0 &&
        message.length < 300 &&
        !message.includes('Traceback') &&
        !isTechnicalMessage(message)
    );
}

function joinDetailMessages(details: Array<{ msg?: string }> | undefined): string | undefined {
    if (!Array.isArray(details) || details.length === 0) return undefined;
    const messages = details
        .map((d) => (d && typeof d.msg === 'string' ? d.msg : undefined))
        .filter((m): m is string => Boolean(m));
    return messages.length > 0 ? messages.join('. ') : undefined;
}

function legacyDetailMessage(detail: ApiErrorBody['detail']): string | undefined {
    if (typeof detail === 'string' && isSafeBackendMessage(detail)) return detail;
    if (Array.isArray(detail)) return joinDetailMessages(detail);
    return undefined;
}

function messageForAxiosError(err: AxiosError, fallback: string): string {
    const response = err.response;

    if (!response) {
        if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message)) return TIMEOUT_MESSAGE;
        if (err.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
            return OFFLINE_MESSAGE;
        }
        return UNREACHABLE_MESSAGE;
    }

    const status = response.status;
    const body = parseErrorBody(response.data);

    // 5xx bodies are either already-generic backend copy or proxy HTML — show our own copy.
    if (status >= 500) return SERVER_ERROR_MESSAGE;

    if (status === 422 || body?.code === 'VALIDATION_ERROR') {
        // Prefer field messages from pydantic details over the "body.field: msg" string.
        return joinDetailMessages(body?.details) ?? VALIDATION_MESSAGE;
    }

    const backendMessage = body?.message;
    if (isSafeBackendMessage(backendMessage)) return backendMessage;

    const legacy = legacyDetailMessage(body?.detail);
    if (legacy) return legacy;

    return STATUS_MESSAGES[status] ?? fallback;
}

/** Turn any thrown value into copy safe to show a user. */
export function getUserErrorMessage(err: unknown, fallback: string = GENERIC_ERROR_MESSAGE): string {
    if (isStaleClientChunkError(err)) {
        return 'The app has been updated. Please reload the page.';
    }
    if (isCanceledError(err)) return fallback;

    if (axios.isAxiosError(err)) return messageForAxiosError(err, fallback);

    if (err instanceof Error && err.message && !isTechnicalMessage(err.message)) {
        return err.message;
    }
    if (typeof err === 'string' && err && !isTechnicalMessage(err)) return err;

    return fallback;
}

/**
 * Toast-ready description of an error. `id` keys sonner dedup so retry storms
 * collapse into one toast; `description` carries the correlation id for 5xx
 * failures so users can quote it to support.
 */
export function describeErrorForToast(
    err: unknown,
    fallback: string = GENERIC_ERROR_MESSAGE,
): { message: string; description?: string; id: string } {
    const message = getUserErrorMessage(err, fallback);
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const correlationId = status != null && status >= 500 ? getErrorCorrelationId(err) : undefined;
    return {
        message,
        description: correlationId ? `Error ID: ${correlationId}` : undefined,
        id: `err:${message}`,
    };
}
