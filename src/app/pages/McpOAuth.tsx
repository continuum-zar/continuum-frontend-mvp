import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import api from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Loader2 } from 'lucide-react';

/**
 * OAuth consent handoff for Cursor MCP: backend redirects here from /api/v1/oauth/authorize
 * with PKCE params; we POST /oauth/consent with the logged-in user's JWT and redirect to Cursor.
 */
export function McpOAuth() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const client_id = searchParams.get('client_id');
        const redirect_uri = searchParams.get('redirect_uri');
        const code_challenge = searchParams.get('code_challenge');
        const code_challenge_method = searchParams.get('code_challenge_method') || 'S256';
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');

        if (!client_id || !redirect_uri || !code_challenge) {
            setError('Missing OAuth parameters. Close this window and try connecting from Cursor again.');
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.post<{ redirect_url: string }>('/oauth/consent', {
                    client_id,
                    redirect_uri,
                    code_challenge,
                    code_challenge_method,
                    state: state ?? undefined,
                    scope: scope ?? undefined,
                });
                if (cancelled) return;
                window.location.href = data.redirect_url;
            } catch (e: unknown) {
                const msg =
                    e && typeof e === 'object' && 'response' in e
                        ? String((e as { response?: { data?: { detail?: string } } }).response?.data?.detail)
                        : 'Could not complete authorization.';
                setError(msg || 'Could not complete authorization.');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-svh bg-background flex items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Connection failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-background flex flex-col items-center justify-center gap-4 text-foreground">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Connecting Cursor to Continuum…</p>
        </div>
    );
}
