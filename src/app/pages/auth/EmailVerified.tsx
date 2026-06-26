import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Check, AlertCircle } from 'lucide-react';

/** Same spring check used for project-created / MCP-connected success. */
function SuccessCheck() {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
            <Check className="mx-auto size-16 text-emerald-500" aria-hidden />
        </motion.div>
    );
}

/**
 * Email-verification result page.
 *
 * The verification link in the email opens the backend endpoint
 * (`GET /api/v1/users/verify-email?token=…`), which verifies the token and
 * then redirects the browser here with `?status=success` or `?status=invalid`.
 *
 * On success this is a terminal confirmation: the original "Check your inbox"
 * tab is polling and advances itself into onboarding, so this tab (often opened
 * fresh by the email client) just tells the user they can close it.
 */
export function EmailVerified() {
    const [searchParams] = useSearchParams();
    const success = searchParams.get('status') !== 'invalid';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#B2E6F7] to-[#FFFFFF] p-4">
            <div className="w-[345px] overflow-hidden rounded-2xl border border-[#F5F5F5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
                <div className="flex h-[54px] items-center justify-center border-b border-[#F5F5F5] bg-[#F9F9F9] px-6 pb-4 pt-4">
                    <h2 className="m-0 text-sm font-medium leading-[100%] text-[#595959]">
                        {success ? 'Email verified' : 'Verification failed'}
                    </h2>
                </div>

                <div className="flex flex-col items-center gap-5 px-6 pb-9 pt-8 text-center">
                    {success ? (
                        <SuccessCheck />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5484D]/10">
                            <AlertCircle className="h-6 w-6 text-[#E5484D]" />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <h1 className="m-0 text-lg font-semibold text-[#151515]">
                            {success ? "You're all set" : 'This link didn’t work'}
                        </h1>
                        <p className="m-0 text-sm leading-[1.4] text-[#595959]">
                            {success
                                ? 'Your email address has been verified. You can close this window.'
                                : 'This verification link is invalid or has already been used. Try signing in — if your email still isn’t verified, register again to get a fresh link.'}
                        </p>
                    </div>

                    {!success && (
                        <Link
                            to="/login"
                            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#24B5F8] px-4 py-2 text-sm font-semibold text-white shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)]"
                        >
                            Back to sign in
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
