import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useSignUp } from '@clerk/clerk-react';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { isClerkEnabled } from '@/lib/clerkConfig';
import { isEmailNotVerifiedError } from '@/lib/errorMessages';

/**
 * Same UI as the legacy sign-up form. When Clerk is enabled the submit handler
 * routes through `useSignUp`; otherwise it falls back to the existing zustand
 * register action. Clerk hooks must run inside ClerkProvider, so each backend
 * gets its own shell component.
 */
export function SignUp() {
  return isClerkEnabled ? <ClerkSignUpShell /> : <LegacySignUpShell />;
}

function ClerkSignUpShell() {
    const clerkSignUp = useSignUp();
    const register = useAuthStore((state) => state.register);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [clerkError, setClerkError] = useState<string | null>(null);
    const [pending, setPending] = useState<null | 'email' | 'google' | 'apple'>(null);

    // Continuum #1344: manual sign-up goes to the backend; Clerk is only used
    // for social providers (Google/Apple) below.
    const handleSubmit = async (form: { firstName: string; lastName: string; email: string; password: string }) => {
        setClerkError(null);
        setPending('email');
        try {
            await register({
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                password: form.password,
            });
            navigate('/onboarding/usage', { replace: true });
        } catch (err: unknown) {
            // Account created but email not verified yet → show the "check your
            // inbox" page instead of a permission error.
            if (isEmailNotVerifiedError(err)) {
                navigate('/verify-email', { state: { email: form.email }, replace: true });
                return;
            }
            setClerkError(
                (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
                    ? (err as { message: string }).message
                    : null)
                    ?? 'Registration failed. Try again.',
            );
        } finally {
            setPending(null);
        }
    };

    const handleOAuth = async (provider: 'google' | 'apple') => {
        if (!clerkSignUp.isLoaded) return;
        setClerkError(null);
        setPending(provider);
        try {
            await clerkSignUp.signUp.authenticateWithRedirect({
                strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/onboarding/usage',
            });
        } catch (err: unknown) {
            setClerkError(
                extractClerkErrorMessage(err)
                    ?? `Could not start ${provider === 'google' ? 'Google' : 'Apple'} sign-up.`,
            );
            setPending(null);
        }
    };

    const oauthDisabled = !clerkSignUp.isLoaded || pending !== null;

    return (
        <SignUpLayout
            searchParams={searchParams}
            pending={pending === 'email'}
            error={clerkError}
            onSubmit={handleSubmit}
            googleProps={{
                disabled: oauthDisabled,
                pending: pending === 'google',
                onClick: () => void handleOAuth('google'),
                title: 'Sign up with Google',
            }}
            appleProps={{
                disabled: oauthDisabled,
                pending: pending === 'apple',
                onClick: () => void handleOAuth('apple'),
                title: 'Sign up with Apple',
            }}
        />
    );
}

function LegacySignUpShell() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const [pending, setPending] = useState(false);

    const handleSubmit = async (form: { firstName: string; lastName: string; email: string; password: string }) => {
        setPending(true);
        try {
            await register({
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                password: form.password,
            });
            navigate('/onboarding/usage', { replace: true });
        } catch (err) {
            if (isEmailNotVerifiedError(err)) {
                navigate('/verify-email', { state: { email: form.email }, replace: true });
                return;
            }
            console.error('Registration failed:', err);
        } finally {
            setPending(false);
        }
    };

    return (
        <SignUpLayout
            searchParams={searchParams}
            pending={pending || isLoading}
            error={error}
            onSubmit={handleSubmit}
            googleProps={{
                disabled: true,
                pending: false,
                onClick: () => {},
                title: 'Google sign-up is not available yet',
            }}
            appleProps={{
                disabled: true,
                pending: false,
                onClick: () => {},
                title: 'Apple sign-up is not available yet',
            }}
        />
    );
}

type SocialButtonProps = {
    disabled: boolean;
    pending: boolean;
    onClick: () => void;
    title: string;
};

function SignUpLayout(props: {
    searchParams: URLSearchParams;
    pending: boolean;
    error: string | null;
    onSubmit?: (form: { firstName: string; lastName: string; email: string; password: string }) => void | Promise<void>;
    renderVerification?: () => React.ReactNode;
    googleProps?: SocialButtonProps;
    appleProps?: SocialButtonProps;
}) {
    const { searchParams, pending, error, onSubmit, renderVerification, googleProps, appleProps } = props;
    const location = useLocation();
    const clearError = useAuthStore((state) => state.clearError);
    const emailFromSignUp = (location.state as { email?: string } | null)?.email ?? '';
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(emailFromSignUp);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    useEffect(() => {
        const t = searchParams.get('invite_token')?.trim();
        if (t) {
            try {
                sessionStorage.setItem(SESSION_INVITE_TOKEN_KEY, t);
            } catch {
                /* ignore */
            }
        }
    }, [searchParams]);

    const validateForm = () => {
        const newErrors: typeof errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !onSubmit) return;
        void onSubmit({ firstName, lastName, email, password });
    };

    const handleInputChange = (field: keyof typeof errors, value: string) => {
        if (field === 'email') setEmail(value);
        if (field === 'password') setPassword(value);
        if (field === 'confirmPassword') setConfirmPassword(value);
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#B2E6F7] to-[#FFFFFF] p-4">
            <div className="w-[345px] overflow-hidden rounded-2xl border border-[#F5F5F5] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
                <div className="relative flex h-[54px] w-[345px] items-center justify-center border-b border-[#F5F5F5] bg-[#F9F9F9] px-6 pb-4 pt-4">
                    <Link
                        to="/"
                        className="absolute left-6 flex h-5 w-5 items-center justify-center"
                        aria-label="Back to landing page"
                    >
                        <img src="/auth/arrow.svg" alt="" className="h-5 w-5" />
                    </Link>
                    <h2 className="m-0 h-[22px] w-[54px] text-sm font-medium leading-[100%] text-[#595959]">Sign up</h2>
                </div>

                {renderVerification ? (
                    <div className="flex w-[345px] flex-col items-center gap-6 bg-white px-6 pb-9 pt-6">
                        {renderVerification()}
                        {error && <p className="text-center text-xs text-red-600">{error}</p>}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex w-[345px] flex-col gap-6 bg-white px-6 pb-9 pt-6">
                        {googleProps && appleProps ? (
                            <div className="flex w-[297px] flex-col gap-2">
                                <SocialButton {...googleProps} iconSrc="/auth/google.svg" label="Continue with Google" />
                                <SocialButton {...appleProps} iconSrc="/auth/apple.svg" label="Continue with Apple" />
                                <div className="my-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#9FA5A8]">
                                    <span className="h-px flex-1 bg-[#E9E9E9]" aria-hidden />
                                    or
                                    <span className="h-px flex-1 bg-[#E9E9E9]" aria-hidden />
                                </div>
                            </div>
                        ) : null}

                        <div className="flex w-[297px] flex-col gap-1">
                            <label htmlFor="email" className="text-sm font-medium leading-[100%] text-[#151515]">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                                disabled={pending}
                                className={`h-10 w-[297px] rounded-lg border bg-white px-4 py-2 text-sm text-[#151515] outline-none ${errors.email ? 'border-destructive' : 'border-[#E9E9E9]'}`}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div className="flex w-[297px] flex-col gap-1">
                            <label htmlFor="firstName" className="text-sm font-medium leading-[100%] text-[#151515]">First name</label>
                            <input
                                id="firstName"
                                type="text"
                                placeholder="Enter first name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                disabled={pending}
                                className="h-10 w-[297px] rounded-lg border border-[#E9E9E9] bg-white px-4 py-2 text-sm text-[#151515] outline-none"
                            />
                        </div>

                        <div className="flex w-[297px] flex-col gap-1">
                            <label htmlFor="lastName" className="text-sm font-medium leading-[100%] text-[#151515]">Surname</label>
                            <input
                                id="lastName"
                                type="text"
                                placeholder="Enter surname"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                disabled={pending}
                                className="h-10 w-[297px] rounded-lg border border-[#E9E9E9] bg-white px-4 py-2 text-sm text-[#151515] outline-none"
                            />
                        </div>

                        <div className="flex w-[297px] flex-col gap-1">
                            <label htmlFor="password" className={`${errors.password ? 'text-destructive' : 'text-[#151515]'} text-sm font-medium leading-[100%]`}>Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                required
                                disabled={pending}
                                className={`h-10 w-[297px] rounded-lg border bg-white px-4 py-2 text-sm text-[#151515] outline-none ${errors.password ? 'border-destructive' : 'border-[#E9E9E9]'}`}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div className="flex w-[297px] flex-col gap-1">
                            <label htmlFor="confirmPassword" className={`${errors.confirmPassword ? 'text-destructive' : 'text-[#151515]'} text-sm font-medium leading-[100%]`}>Confirm password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                required
                                disabled={pending}
                                className={`h-10 w-[297px] rounded-lg border bg-white px-4 py-2 text-sm text-[#151515] outline-none ${errors.confirmPassword ? 'border-destructive' : 'border-[#E9E9E9]'}`}
                            />
                            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={pending}
                            className="flex h-10 w-[297px] cursor-pointer items-center justify-center rounded-lg border-none bg-[#24B5F8] px-4 py-2 shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {pending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <span className="text-sm font-semibold text-white">Next</span>
                            )}
                        </button>
                        {(error || Object.keys(errors).length > 0) && (
                            <p className="text-center text-xs text-red-600">
                                {error || 'Please correct the highlighted fields.'}
                            </p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}

function SocialButton(props: SocialButtonProps & { iconSrc: string; label: string }) {
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
            <span className="text-sm font-medium leading-[100%] text-[#151515]">{label}</span>
        </button>
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
