import { Link, useLocation } from 'react-router';
import { Mail } from 'lucide-react';

/**
 * "Awaiting email verification" screen.
 *
 * Users land here after registering (or trying to sign in) with an account
 * whose email has not been verified yet — the backend returns 403
 * `EMAIL_NOT_VERIFIED` and the sign-up / login handlers redirect here instead
 * of surfacing a permission error. The email address is passed via router
 * navigation state so we can show the user exactly where the link was sent.
 */
export function VerifyEmail() {
    const location = useLocation();
    const email = (location.state as { email?: string } | null)?.email;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#B2E6F7] to-[#FFFFFF] p-4">
            <div className="w-[345px] overflow-hidden rounded-2xl border border-[#F5F5F5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
                <div className="flex h-[54px] items-center justify-center border-b border-[#F5F5F5] bg-[#F9F9F9] px-6 pb-4 pt-4">
                    <h2 className="m-0 text-sm font-medium leading-[100%] text-[#595959]">Verify your email</h2>
                </div>

                <div className="flex flex-col items-center gap-5 px-6 pb-9 pt-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#24B5F8]/10">
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
                            . Click the link in that email to activate your account, then sign in.
                        </p>
                    </div>

                    <p className="m-0 text-xs leading-[1.4] text-[#9FA5A8]">
                        Can&apos;t find it? Check your spam or junk folder. The link is valid for a single use.
                    </p>

                    <Link
                        to="/login"
                        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#24B5F8] px-4 py-2 text-sm font-semibold text-white shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)]"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
