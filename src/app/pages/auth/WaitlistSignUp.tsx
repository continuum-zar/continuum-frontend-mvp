import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { useSignUp } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { checkEmailExists } from '@/api/auth';
import { isClerkEnabled } from '@/lib/clerkConfig';

export function WaitlistSignUp() {
  return isClerkEnabled ? <ClerkShell /> : <LegacyShell />;
}

function ClerkShell() {
  const clerkSignUp = useSignUp();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState<null | 'google' | 'apple'>(null);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (!clerkSignUp.isLoaded) return;
    setOauthError(null);
    setOauthPending(provider);
    try {
      await clerkSignUp.signUp.authenticateWithRedirect({
        strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding/usage',
      });
    } catch (err: unknown) {
      setOauthError(
        extractClerkErrorMessage(err)
          ?? `Could not start ${provider === 'google' ? 'Google' : 'Apple'} sign-up.`,
      );
      setOauthPending(null);
    }
  };

  return (
    <WaitlistLayout
      googleDisabled={!clerkSignUp.isLoaded || oauthPending !== null}
      googlePending={oauthPending === 'google'}
      onGoogleClick={() => void handleOAuth('google')}
      googleTitle="Continue with Google"
      appleDisabled={!clerkSignUp.isLoaded || oauthPending !== null}
      applePending={oauthPending === 'apple'}
      onAppleClick={() => void handleOAuth('apple')}
      appleTitle="Continue with Apple"
      headerError={oauthError}
    />
  );
}

function LegacyShell() {
  return (
    <WaitlistLayout
      googleDisabled
      googlePending={false}
      onGoogleClick={() => {}}
      googleTitle="Google sign-in is not available yet"
      appleDisabled
      applePending={false}
      onAppleClick={() => {}}
      appleTitle="Apple sign-in is not available yet"
      headerError={null}
    />
  );
}

function WaitlistLayout(props: {
  googleDisabled: boolean;
  googlePending: boolean;
  onGoogleClick: () => void;
  googleTitle: string;
  appleDisabled: boolean;
  applePending: boolean;
  onAppleClick: () => void;
  appleTitle: string;
  headerError: string | null;
}) {
  const {
    googleDisabled,
    googlePending,
    onGoogleClick,
    googleTitle,
    appleDisabled,
    applePending,
    onAppleClick,
    appleTitle,
    headerError,
  } = props;
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const error = touched ? validateEmail(email) : '';

  const handleBlur = () => setTouched(true);

  const validateForm = () => {
    setTouched(true);
    return !validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { exists } = await checkEmailExists(email);
      if (exists) {
        navigate('/login', { state: { email } });
      } else {
        navigate('/register', { state: { email } });
      }
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? 'Could not verify this email right now. Please try again.')
        : 'Could not verify this email right now. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#B2E6F7] to-[#FDFBF7] dark:from-[#0b1f2e] dark:to-[#0f172a]">
      <div className="mx-auto flex w-[345px] flex-col items-center gap-4 pt-[191px]">
        <div className="w-full overflow-hidden rounded-2xl border border-border shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
          <div className="flex flex-col items-center border-b border-border bg-card px-6 pb-6 pt-9">
            <div className="flex flex-col items-center gap-3 text-center text-foreground">
              <p className="font-sarina-sans text-[33px] leading-[37px] tracking-[-0.66px]">Continuum</p>
              <p className="font-['Sathu:Regular',sans-serif] text-xs tracking-[-0.12px] opacity-80">Time track with one click.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-muted px-6 pb-9 pt-6">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  aria-disabled={googleDisabled}
                  disabled={googleDisabled}
                  title={googleTitle}
                  onClick={onGoogleClick}
                  className={`relative flex h-10 w-full items-center justify-center rounded-lg border border-border bg-card px-4 ${
                    googleDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  {googlePending ? (
                    <Loader2 className="absolute left-[9px] h-5 w-5 animate-spin text-foreground" />
                  ) : (
                    <img src="/auth/google.svg" alt="Google" className="absolute left-[9px] h-5 w-5" />
                  )}
                  <span className="text-sm font-medium text-foreground">Continue with Google</span>
                </button>

                <button
                  type="button"
                  aria-disabled={appleDisabled}
                  disabled={appleDisabled}
                  title={appleTitle}
                  onClick={onAppleClick}
                  className={`relative flex h-10 w-full items-center justify-center rounded-lg border border-border bg-card px-4 ${
                    appleDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  {applePending ? (
                    <Loader2 className="absolute left-2 h-5 w-5 animate-spin text-foreground" />
                  ) : (
                    <img src="/auth/apple.svg" alt="Apple" className="absolute left-2 h-5 w-5" />
                  )}
                  <span className="text-sm font-medium text-foreground">Continue with Apple</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="What's your email address?"
                    required
                    className="h-10 w-full rounded-lg border border-border bg-input px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg bg-info text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Continue with email'}
                </button>
                {submitError && (
                  <p className="text-xs text-destructive">{submitError}</p>
                )}
                {headerError && !submitError && (
                  <p className="text-xs text-destructive">{headerError}</p>
                )}
              </form>
            </div>

            <p className="w-full text-center text-sm font-medium text-muted-foreground">
              Have an account?{' '}
              <Link to="/login" className="text-foreground no-underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="px-4 text-center text-xs font-medium text-muted-foreground">
          By clicking "Sign in" or "Continue" above, you acknowledge that you have read and understood, and agree to
          Continuum&apos;s <span className="underline">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}

function extractClerkErrorMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null) {
    const errors = (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (first?.longMessage) return first.longMessage;
      if (first?.message) return first.message;
    }
    const message = (err as { message?: string }).message;
    if (typeof message === 'string' && message) return message;
  }
  return null;
}
