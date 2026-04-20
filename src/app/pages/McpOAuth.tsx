import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import api from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { isAxiosError, isCancel } from 'axios';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const MCP_OAUTH_SESSION_KEY = 'continuum-mcp-oauth-completed';
const REDIRECT_FALLBACK_MS = 10_000;

function logRedirectUrlSafe(redirectUrl: string) {
    try {
        const u = new URL(redirectUrl);
        console.info(
            `[McpOAuth] consent OK; redirect target ${u.protocol}//${u.host}${u.pathname} (query not logged)`
        );
    } catch {
        console.info('[McpOAuth] consent OK; redirect URL present (could not parse for logging)');
    }
}

function extractBackendDetail(data: unknown): string | null {
    if (!data || typeof data !== 'object' || !('detail' in data)) return null;
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((item) => (typeof item === 'object' && item && 'msg' in item ? String((item as { msg: unknown }).msg) : JSON.stringify(item)))
            .join(' ');
    }
    return null;
}

type OAuthError = {
    title: string;
    description: ReactNode;
};

function buildOAuthError(error: unknown): OAuthError {
    if (!isAxiosError(error)) {
        return {
            title: 'Connection failed',
            description: (
                <>
                    <p className="mb-2">Something unexpected stopped authorization.</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>Go back to Cursor and start the Continuum connection again.</li>
                        <li>If this keeps happening, contact your workspace admin.</li>
                    </ul>
                </>
            ),
        };
    }

    if (error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED') {
        return {
            title: 'Request cancelled or timed out',
            description: (
                <>
                    <p className="mb-2">The authorization request did not finish in time.</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>Check your network connection, then try reconnecting from Cursor.</li>
                        <li>If you are on a slow network, wait a moment and try again.</li>
                    </ul>
                </>
            ),
        };
    }

    if (!error.response) {
        return {
            title: 'Network error',
            description: (
                <>
                    <p className="mb-2">We could not reach Continuum to complete the handoff.</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>Confirm you are online and that VPN or firewall rules allow this site.</li>
                        <li>Try reconnecting from Cursor after refreshing this page.</li>
                    </ul>
                </>
            ),
        };
    }

    const status = error.response.status;
    const detail = extractBackendDetail(error.response.data) ?? error.message;

    if (status === 401 || status === 403) {
        return {
            title: 'Session expired or not allowed',
            description: (
                <>
                    <p className="mb-2">{detail}</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>Sign in to Continuum in this browser, then return to Cursor and connect again.</li>
                        <li>If you use multiple accounts, ensure you are signed into the correct one.</li>
                    </ul>
                </>
            ),
        };
    }

    if (status >= 500) {
        return {
            title: 'Server error',
            description: (
                <>
                    <p className="mb-2">{detail}</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>Wait a minute and try reconnecting from Cursor.</li>
                        <li>If the problem continues, contact support with the time you tried.</li>
                    </ul>
                </>
            ),
        };
    }

    return {
        title: 'Authorization was rejected',
        description: (
            <>
                <p className="mb-2">{detail}</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Close this window and start the connection again from Cursor.</li>
                    <li>Ask an admin to confirm MCP OAuth is enabled for your workspace.</li>
                </ul>
            </>
        ),
    };
}

function missingParamsError(missing: string[]): OAuthError {
    return {
        title: 'Missing OAuth parameters',
        description: (
            <>
                <p className="mb-2">This page needs a full redirect from Cursor. Missing: {missing.join(', ')}.</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Close this tab and use Cursor&apos;s Continuum integration to connect again.</li>
                    <li>Do not bookmark this page; always start from Cursor.</li>
                </ul>
            </>
        ),
    };
}

/**
 * OAuth consent handoff for Cursor MCP: backend redirects here from /api/v1/oauth/authorize
 * with PKCE params; we POST /oauth/consent with the logged-in user's JWT and redirect to Cursor.
 */
function McpOAuthInner() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<OAuthError | null>(null);
    const [phase, setPhase] = useState<
        'loading' | 'success-pending-redirect' | 'success-stalled' | 'revisit-success'
    >('loading');
    const [fallbackRedirectUrl, setFallbackRedirectUrl] = useState<string | null>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const client_id = searchParams.get('client_id');
        const redirect_uri = searchParams.get('redirect_uri');
        const code_challenge = searchParams.get('code_challenge');
        const code_challenge_method = searchParams.get('code_challenge_method') || 'S256';
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');

        const missing: string[] = [];
        if (!client_id) missing.push('client_id');
        if (!redirect_uri) missing.push('redirect_uri');
        if (!code_challenge) missing.push('code_challenge');

        if (missing.length > 0) {
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(MCP_OAUTH_SESSION_KEY)) {
                setPhase('revisit-success');
                return;
            }
            setError(missingParamsError(missing));
            return;
        }

        let cancelled = false;
        const abortController = new AbortController();

        (async () => {
            console.info('[McpOAuth] starting POST /oauth/consent');
            try {
                const { data } = await api.post<{ redirect_url: string }>(
                    '/oauth/consent',
                    {
                        client_id,
                        redirect_uri,
                        code_challenge,
                        code_challenge_method,
                        state: state ?? undefined,
                        scope: scope ?? undefined,
                    },
                    { signal: abortController.signal }
                );

                if (cancelled) {
                    console.info('[McpOAuth] consent response ignored (effect cancelled)');
                    return;
                }

                const redirectUrl = data?.redirect_url?.trim();
                if (!redirectUrl) {
                    console.error('[McpOAuth] consent response missing redirect_url', data);
                    setError({
                        title: 'Invalid response from server',
                        description: (
                            <>
                                <p className="mb-2">The server did not return a redirect address.</p>
                                <ul className="list-disc pl-4 space-y-1 text-sm">
                                    <li>Try reconnecting from Cursor.</li>
                                    <li>If this repeats, report it to Continuum support.</li>
                                </ul>
                            </>
                        ),
                    });
                    return;
                }

                logRedirectUrlSafe(redirectUrl);
                try {
                    sessionStorage.setItem(MCP_OAUTH_SESSION_KEY, String(Date.now()));
                } catch {
                    /* ignore quota / private mode */
                }

                setFallbackRedirectUrl(redirectUrl);
                setPhase('success-pending-redirect');

                fallbackTimerRef.current = setTimeout(() => {
                    if (cancelled) return;
                    console.warn(
                        `[McpOAuth] no navigation detected after ${REDIRECT_FALLBACK_MS}ms; showing manual handoff`
                    );
                    setPhase('success-stalled');
                }, REDIRECT_FALLBACK_MS);

                window.location.assign(redirectUrl);
            } catch (e: unknown) {
                if (cancelled) return;
                if (isCancel(e)) {
                    console.info('[McpOAuth] consent request aborted');
                    return;
                }
                console.error('[McpOAuth] consent POST failed', e);
                setError(buildOAuthError(e));
            }
        })();

        return () => {
            cancelled = true;
            abortController.abort();
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
        };
    }, [searchParams]);

    const handleCloseWindow = () => {
        window.close();
    };

    if (error) {
        return (
            <div className="min-h-svh bg-background flex items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                    <XCircle className="size-4" aria-hidden />
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription className="text-destructive-foreground/90">{error.description}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (phase === 'revisit-success') {
        return (
            <div className="min-h-svh bg-background flex flex-col items-center justify-center gap-4 p-6 text-center text-foreground">
                <CheckCircle2 className="size-10 text-[color:var(--success)]" aria-hidden />
                <div className="max-w-md space-y-2">
                    <h1 className="text-lg font-semibold">Already connected</h1>
                    <p className="text-sm text-muted-foreground">
                        Cursor was linked to Continuum in this browser session. You can close this tab.
                    </p>
                </div>
                <Button type="button" variant="secondary" onClick={handleCloseWindow}>
                    Close this window
                </Button>
            </div>
        );
    }

    if (phase === 'success-stalled' && fallbackRedirectUrl) {
        return (
            <div className="min-h-svh bg-background flex flex-col items-center justify-center gap-6 p-6 text-center text-foreground">
                <CheckCircle2 className="size-10 text-[color:var(--success)]" aria-hidden />
                <div className="max-w-md space-y-2">
                    <h1 className="text-lg font-semibold">Success</h1>
                    <p className="text-sm text-muted-foreground">
                        Continuum authorized Cursor. If your editor did not open automatically, use the button below to
                        finish the handoff. You may close this window afterward.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild variant="default">
                        <a href={fallbackRedirectUrl}>Continue to Cursor</a>
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCloseWindow}>
                        Close this window
                    </Button>
                </div>
            </div>
        );
    }

    if (phase === 'success-pending-redirect') {
        return (
            <div className="min-h-svh bg-background flex flex-col items-center justify-center gap-4 text-foreground">
                <CheckCircle2 className="size-8 text-[color:var(--success)]" aria-hidden />
                <p className="text-sm font-medium text-foreground">Success — returning to Cursor…</p>
                <Loader2
                    className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none"
                    aria-hidden
                />
                <p className="text-xs text-muted-foreground max-w-sm text-center px-4">
                    If nothing happens in a few seconds, we will show a link to continue manually.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-background flex flex-col items-center justify-center gap-4 text-foreground">
            <Loader2
                className="size-8 animate-spin text-muted-foreground motion-reduce:animate-none"
                aria-hidden
            />
            <p className="text-sm text-muted-foreground">Connecting Cursor to Continuum…</p>
        </div>
    );
}

export function McpOAuth() {
    return (
        <ErrorBoundary>
            <McpOAuthInner />
        </ErrorBoundary>
    );
}
