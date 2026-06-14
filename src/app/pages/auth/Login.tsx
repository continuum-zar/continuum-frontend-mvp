import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useSignIn } from '@clerk/clerk-react';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { isClerkEnabled } from '@/lib/clerkConfig';
import { isEmailNotVerifiedError } from '@/lib/errorMessages';
import {
  readLogoutDiagnostic,
  clearLogoutDiagnostic,
  type LogoutDiagnostic,
} from '../../../lib/api';

function logoutMessage(d: LogoutDiagnostic): string {
  switch (d.cause) {
    case 'session_expired':
      return 'Your session expired. Please sign in again.';
    case 'invalid_token':
      return 'Your session is no longer valid. Please sign in again.';
    case 'refresh_failed':
      return d.status === 429
        ? "We're rate-limited right now — please wait a moment and sign in again."
        : 'We could not refresh your session. Please sign in again.';
    case 'manual':
    default:
      return 'Signed out.';
  }
}

/**
 * Single page, two flavours: the existing Continuum UI is reused, but the
 * "submit handler" is swapped depending on `isClerkEnabled` — Clerk's hooks
 * only work inside ClerkProvider, so we mount the Clerk-aware variant only
 * when that's in the tree.
 */
export function Login() {
  return isClerkEnabled ? <LoginInner backend="clerk" /> : <LoginInner backend="legacy" />;
}

type Backend = 'clerk' | 'legacy';

function LoginInner({ backend }: { backend: Backend }) {
  return backend === 'clerk' ? <ClerkLoginShell /> : <LegacyLoginShell />;
}

function ClerkLoginShell() {
  const clerkSignIn = useSignIn();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'google' | 'apple' | 'email'>(null);

  const readInviteToken = () => readSessionInviteToken(searchParams);

  // Continuum #1344: manual email/password auth lives on the backend, even when
  // Clerk is otherwise enabled in the tree. Clerk is reserved for social
  // providers; we never send credentials to Clerk's signIn API here.
  const handleEmailPasswordSubmit = async (email: string, password: string) => {
    setClerkError(null);
    setPending('email');
    try {
      await login({ email, password });
      const inviteToken = readInviteToken();
      navigate('/loading', {
        state: { from: 'login', ...(inviteToken ? { inviteToken } : {}) },
      });
    } catch (err: unknown) {
      // Unverified account → route to the "check your inbox" page, not an error.
      if (isEmailNotVerifiedError(err)) {
        navigate('/verify-email', { state: { email }, replace: true });
        return;
      }
      setClerkError(
        (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : null)
          ?? 'Login failed. Check your email and password.',
      );
    } finally {
      setPending(null);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (!clerkSignIn.isLoaded) return;
    setClerkError(null);
    setPending(provider);
    try {
      await clerkSignIn.signIn.authenticateWithRedirect({
        strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/loading',
      });
    } catch (err: unknown) {
      setClerkError(
        extractClerkErrorMessage(err)
          ?? `Could not start ${provider === 'google' ? 'Google' : 'Apple'} sign-in.`,
      );
      setPending(null);
    }
  };

  const oauthDisabled = !clerkSignIn.isLoaded || pending !== null;

  return (
    <LoginLayout
      footer={searchParams}
      googleProps={{
        disabled: oauthDisabled,
        pending: pending === 'google',
        onClick: () => void handleOAuth('google'),
        title: 'Continue with Google',
      }}
      appleProps={{
        disabled: oauthDisabled,
        pending: pending === 'apple',
        onClick: () => void handleOAuth('apple'),
        title: 'Continue with Apple',
      }}
      onEmailSubmit={handleEmailPasswordSubmit}
      submitPending={pending === 'email'}
      submitDisabled={pending !== null}
      error={clerkError}
    />
  );
}

function LegacyLoginShell() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const handleEmailPasswordSubmit = async (email: string, password: string) => {
    try {
      await login({ email, password });
      const inviteToken = readSessionInviteToken(searchParams);
      navigate('/loading', {
        state: { from: 'login', ...(inviteToken ? { inviteToken } : {}) },
      });
    } catch (err) {
      if (isEmailNotVerifiedError(err)) {
        navigate('/verify-email', { state: { email }, replace: true });
        return;
      }
      console.error('Login error:', err);
    }
  };

  return (
    <LoginLayout
      footer={searchParams}
      googleProps={{
        disabled: true,
        pending: false,
        onClick: () => {},
        title: 'Google sign-in is not available yet',
      }}
      appleProps={{
        disabled: true,
        pending: false,
        onClick: () => {},
        title: 'Apple sign-in is not available yet',
      }}
      onEmailSubmit={handleEmailPasswordSubmit}
      submitPending={isLoading}
      submitDisabled={isLoading}
      error={error}
    />
  );
}

type ButtonProps = {
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
  title: string;
};

function LoginLayout(props: {
  footer: URLSearchParams;
  googleProps: ButtonProps;
  appleProps: ButtonProps;
  onEmailSubmit: (email: string, password: string) => void | Promise<void>;
  submitPending: boolean;
  submitDisabled: boolean;
  error: string | null;
}) {
  const { footer, googleProps, appleProps, onEmailSubmit, submitPending, submitDisabled, error } = props;
  const location = useLocation();
  const clearError = useAuthStore((state) => state.clearError);
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [logoutBanner, setLogoutBanner] = useState<LogoutDiagnostic | null>(() =>
    readLogoutDiagnostic(),
  );

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    const t = footer.get('invite_token')?.trim();
    if (t) {
      try {
        sessionStorage.setItem(SESSION_INVITE_TOKEN_KEY, t);
      } catch {
        /* ignore */
      }
    }
  }, [footer]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
    return '';
  };
  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };
  const errors = {
    email: touched.email ? validateEmail(email) : '',
    password: touched.password ? validatePassword(password) : '',
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (validateEmail(email) || validatePassword(password)) return;
    void onEmailSubmit(email, password);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#A8E5FE] to-[#FAF8F4] p-10">
      <div className="w-[345px] overflow-hidden rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.1)]">
        <div className="flex h-[118px] w-[345px] flex-col items-center gap-4 border-b border-[#F5F5F5] bg-white px-6 pb-6 pt-9">
          <div className="flex h-[58px] w-[219px] flex-col items-center gap-3">
            <img src="/auth/Continuum.svg" alt="Continuum Logo" className="h-[37px] w-[219px]" />
            <p className="text-center text-xs font-medium leading-[100%] tracking-[-0.12px] text-[#252014] opacity-80">
              Time track with one click.
            </p>
          </div>
        </div>

        <div className="flex w-[345px] flex-col gap-6 bg-[#F8F9F9] px-6 pb-6 pt-6">
          <div className="flex h-[88px] w-[297px] flex-col gap-2">
            <SocialButton
              {...googleProps}
              iconSrc="/auth/google.svg"
              label="Continue with Google"
            />
            <SocialButton
              {...appleProps}
              iconSrc="/auth/apple.svg"
              label="Continue with Apple"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex w-[297px] flex-col gap-2">
            <div className="flex w-[297px] flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-[#252014]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="What's your email address?"
                required
                disabled={submitPending}
                className="h-10 w-[297px] rounded-lg border border-[#E9E9E9] bg-white px-4 py-2 text-sm text-[#252014] outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="flex w-[297px] flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-[#252014]">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="What's your password?"
                required
                disabled={submitPending}
                className="h-10 w-[297px] rounded-lg border border-[#E9E9E9] bg-white px-4 py-2 text-sm text-[#252014] outline-none"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <span
              className="self-end cursor-not-allowed text-xs text-[#252014] opacity-60"
              title="Forgot password is currently unavailable"
              aria-disabled="true"
            >
              Forgot password
            </span>

            <div className="flex w-[297px] flex-col gap-2">
              <button
                type="submit"
                disabled={submitDisabled}
                className="flex h-10 w-[297px] cursor-pointer items-center justify-center rounded-lg border-none bg-[#24B5F8] px-4 py-2 shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span className="text-sm font-semibold text-white">Sign in</span>
                )}
              </button>

              {error && <p className="text-center text-xs text-red-600">{error}</p>}

              {!error && logoutBanner && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-center text-xs text-amber-800">
                    {logoutMessage(logoutBanner)}
                  </p>
                  <button
                    type="button"
                    className="mt-1 block w-full text-center text-[10px] text-amber-700 underline"
                    onClick={() => {
                      clearLogoutDiagnostic();
                      setLogoutBanner(null);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1">
                <p className="text-sm text-[#9FA5A8]">Don't have an account?</p>
                <Link
                  to={
                    footer.get('invite_token')?.trim()
                      ? `/register?invite_token=${encodeURIComponent(footer.get('invite_token')!.trim())}`
                      : '/sign-up'
                  }
                  className="text-sm text-[#252014] no-underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute mt-[590px] flex h-12 w-[345px] items-center justify-center px-4">
        <p className="text-center text-[11px] font-medium leading-[1.4] text-[#252014] opacity-60">
          By clicking "Sign in" or "Continue" above, you acknowledge that you have read and understood, and agree to
          Continuum's{' '}
          <Link
            to="/terms"
            className="text-[#252014] underline opacity-80 transition-opacity hover:opacity-100"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function SocialButton(props: ButtonProps & { iconSrc: string; label: string }): ReactNode {
  const { disabled, pending, onClick, title, iconSrc, label } = props;
  return (
    <button
      type="button"
      aria-disabled={disabled}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`relative flex h-10 w-[297px] items-center justify-center rounded-lg border border-[#E9E9E9] bg-white px-4 py-2 ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
    >
      {pending ? (
        <Loader2 className="absolute left-4 h-5 w-5 animate-spin text-[#252014]" />
      ) : (
        <img src={iconSrc} alt="" className="absolute left-4 h-5 w-5" />
      )}
      <span className="text-sm font-medium leading-[100%] text-[#252014]">{label}</span>
    </button>
  );
}

function readSessionInviteToken(searchParams: URLSearchParams): string | undefined {
  try {
    return searchParams.get('invite_token')?.trim()
      || sessionStorage.getItem(SESSION_INVITE_TOKEN_KEY)
      || undefined;
  } catch {
    return undefined;
  }
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
