import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

/** How often we re-check whether the email has been verified yet. */
const VERIFY_POLL_INTERVAL_MS = 4000;

/** Where the user lands once their email is confirmed. */
const ONBOARDING_START = '/onboarding/usage';

/**
 * "Awaiting email verification" screen.
 *
 * Users land here right after registering — the account exists but its email
 * isn't verified yet, so the backend refuses authenticated requests with a 403
 * `EMAIL_NOT_VERIFIED`. Registration already set an HttpOnly refresh cookie, so
 * we don't need the password here: we poll `checkAuth()`, which silently
 * refreshes a token from that cookie and calls `/users/me`. While the email is
 * still unverified that call keeps 403-ing; the moment the user clicks the link
 * in their inbox it returns 200, the store's `user` is populated, and we
 * forward them straight into onboarding (instead of back to sign-in).
 *
 * Why poll via `checkAuth` (not a bare `GET /users/me`): when Clerk is enabled
 * the axios 401-retry only refreshes Clerk sessions, so a bare request from a
 * manual signup would 401 forever. `checkAuth` refreshes from the backend
 * cookie directly, sidestepping that gate.
 *
 * Why key the redirect on `user` (not `isAuthenticated`): the refresh step
 * flips `isAuthenticated` true *before* `/users/me` confirms verification, so
 * navigating on it would bounce us to onboarding → AuthGuard → /login early.
 * `user` is only set on a real `/users/me` 200, i.e. an actually-verified user.
 *
 * Because it relies on the persistent cookie rather than in-memory state, the
 * polling keeps working even if this tab is reloaded.
 */
export function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = (location.state as { email?: string } | null)?.email;

    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        let cancelled = false;
        let timer: number | undefined;

        const poll = async () => {
            try {
                await checkAuth(true);
            } catch {
                // 403 (still unverified) or a transient refresh blip — keep waiting.
            }
            if (cancelled) return;
            // `user` is populated only when /users/me returns 200 → verified.
            if (useAuthStore.getState().user) {
                navigate(ONBOARDING_START, { replace: true });
                return; // stop polling
            }
            timer = window.setTimeout(poll, VERIFY_POLL_INTERVAL_MS);
        };

        void poll();
        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [checkAuth, navigate]);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#B2E6F7] to-[#FFFFFF] p-4">
            <div className="w-[345px] overflow-hidden rounded-2xl border border-[#F5F5F5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
                <div className="flex h-[54px] items-center justify-center border-b border-[#F5F5F5] bg-[#F9F9F9] px-6 pb-4 pt-4">
                    <h2 className="m-0 text-sm font-medium leading-[100%] text-[#595959]">Verify your email</h2>
                </div>

                <div className="flex flex-col items-center gap-5 px-6 pb-9 pt-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full">
                        <Mail className="h-6 w-6 text-[#24B5F8]" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="m-0 text-lg font-semibold text-[#151515]">Check your inbox</h1>
                        <p className="m-0 text-sm leading-[1.4] text-[#595959]">
                            We&apos;ve sent a verification link to{' '}
                            {email ? (
                                <strong className="break-all text-[#151515]">{email}</strong>
                            ) : (
                                'your email address'
                            )}
                            . Click the link in that email to activate your account.
                        </p>
                    </div>

                    <p className="m-0 text-xs leading-[1.4] text-[#9FA5A8]">
                        Keep this page open.
                    </p>
                </div>
            </div>
        </div>
    );
}
