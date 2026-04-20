import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import api from '@/lib/api';
import { DashboardLeftRail } from '@/app/components/dashboard-placeholder/DashboardLeftRail';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { isAxiosError, isCancel } from 'axios';
import { Check, XCircle } from 'lucide-react';

const MCP_OAUTH_SESSION_KEY = 'continuum-mcp-oauth-completed';
const REDIRECT_FALLBACK_MS = 10_000;

/** Matches `DashboardPlaceholderHome` / `WorkspaceShellSkeleton` workspace shell. */
const PLACEHOLDER_PAGE_GRADIENT =
    'linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)';

const PLACEHOLDER_MAIN_PANEL_SHADOW =
    'shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]';

const phTitle = "font-['Satoshi',sans-serif] text-[18px] font-semibold text-[#0b191f]";
const phBody = "font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]";
const phHint = "font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#727d83]";

function McpOAuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="box-border flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
            style={{ backgroundImage: PLACEHOLDER_PAGE_GRADIENT }}
        >
            <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
                <div className="isolate flex min-h-0 w-full min-w-0 flex-1 items-stretch gap-[16px]">
                    <DashboardLeftRail />
                    <section
                        className={cn(
                            'relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-[8px] border border-[#ebedee] border-solid bg-white',
                            PLACEHOLDER_MAIN_PANEL_SHADOW
                        )}
                    >
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10">{children}</div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function PlaceholderGradientButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className={cn(
                "inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95",
                'bg-gradient-to-br from-[#24b5f8] to-[#5521fe]'
            )}
        >
            {children}
        </a>
    );
}

/** Same gradient wordmark + soft pulse as AI plan generation (`AIProjectPlanner`). */
const CONTINUUM_WORDMARK_GRADIENT =
    'linear-gradient(135.275deg, rgb(36, 181, 248) 4.6217%, rgb(85, 33, 254) 148.53%)';

/** Same spring check as project-created success in `AIProjectPlanner`. */
function PlannerSuccessCheck() {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
            }}
        >
            <Check className="mx-auto size-16 text-emerald-500" aria-hidden />
        </motion.div>
    );
}

function ContinuumConnectingStatus({
    subtitle,
    hint,
    leading,
}: {
    subtitle: string;
    hint?: string;
    leading?: ReactNode;
}) {
    return (
        <div className="flex w-full max-w-lg flex-col items-center justify-center gap-5 text-center">
            {leading}
            <p
                className="animate-pulse-soft bg-clip-text font-sarina text-[42px] font-normal leading-none tracking-[-0.85px] text-transparent motion-reduce:animate-none motion-reduce:opacity-100"
                style={{ backgroundImage: CONTINUUM_WORDMARK_GRADIENT }}
            >
                Continuum
            </p>
            <p className={cn(phBody)}>{subtitle}</p>
            {hint ? <p className={cn('max-w-sm', phHint)}>{hint}</p> : null}
        </div>
    );
}

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
            <McpOAuthShell>
                <Alert variant="destructive" className="w-full max-w-md font-['Satoshi',sans-serif]">
                    <XCircle className="size-4" aria-hidden />
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription className="text-destructive-foreground/90">{error.description}</AlertDescription>
                </Alert>
            </McpOAuthShell>
        );
    }

    if (phase === 'revisit-success') {
        return (
            <McpOAuthShell>
                <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
                    <PlannerSuccessCheck />
                    <div className="space-y-2">
                        <h1 className={phTitle}>Already connected</h1>
                        <p className={phBody}>
                            Cursor was linked to Continuum in this browser session. You can close this tab.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseWindow}
                        className="h-11 min-w-[200px] border-[#ebedee] bg-white font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] hover:bg-[#f9fafb]"
                    >
                        Close this window
                    </Button>
                </div>
            </McpOAuthShell>
        );
    }

    if (phase === 'success-stalled' && fallbackRedirectUrl) {
        return (
            <McpOAuthShell>
                <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
                    <PlannerSuccessCheck />
                    <div className="space-y-2">
                        <h1 className={phTitle}>Success</h1>
                        <p className={phBody}>
                            Continuum authorized Cursor. If your editor did not open automatically, use the button below
                            to finish the handoff. You may close this window afterward.
                        </p>
                    </div>
                    <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                        <PlaceholderGradientButtonLink href={fallbackRedirectUrl}>Continue to Cursor</PlaceholderGradientButtonLink>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseWindow}
                            className="h-11 min-w-[200px] border-[#ebedee] bg-white font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] hover:bg-[#f9fafb]"
                        >
                            Close this window
                        </Button>
                    </div>
                </div>
            </McpOAuthShell>
        );
    }

    if (phase === 'success-pending-redirect') {
        return (
            <McpOAuthShell>
                <ContinuumConnectingStatus
                    leading={<PlannerSuccessCheck />}
                    subtitle="Success — returning to Cursor…"
                    hint="If nothing happens in a few seconds, we will show a link to continue manually."
                />
            </McpOAuthShell>
        );
    }

    return (
        <McpOAuthShell>
            <ContinuumConnectingStatus subtitle="Connecting Cursor to Continuum…" />
        </McpOAuthShell>
    );
}

export function McpOAuth() {
    return (
        <ErrorBoundary>
            <McpOAuthInner />
        </ErrorBoundary>
    );
}
