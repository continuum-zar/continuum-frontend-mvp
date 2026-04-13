import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

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

  const validateForm = () => {
    setTouched({ email: true, password: true });
    return !validateEmail(email) && !validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login({ email, password });
      let inviteToken: string | undefined;
      try {
        inviteToken =
          searchParams.get('invite_token')?.trim() || sessionStorage.getItem(SESSION_INVITE_TOKEN_KEY) || undefined;
      } catch {
        inviteToken = undefined;
      }
      navigate('/loading', {
        state: {
          from: 'login',
          ...(inviteToken ? { inviteToken } : {}),
        },
      });
    } catch (err) {
      console.error('Login error:', err);
    }
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
            <button
              type="button"
              aria-disabled="true"
              title="Google sign-in is not available yet"
              onClick={(e) => e.preventDefault()}
              className="relative flex h-10 w-[297px] cursor-not-allowed items-center justify-center rounded-lg border border-[#E9E9E9] bg-white px-4 py-2"
            >
              <img src="/auth/google.svg" alt="Google Logo" className="absolute left-4 h-5 w-5" />
              <span className="text-sm font-medium leading-[100%] text-[#252014]">Continue with Google</span>
            </button>

            <button
              type="button"
              aria-disabled="true"
              title="Apple sign-in is not available yet"
              onClick={(e) => e.preventDefault()}
              className="relative flex h-10 w-[297px] cursor-not-allowed items-center justify-center rounded-lg border border-[#E9E9E9] bg-white px-4 py-2"
            >
              <img src="/auth/apple.svg" alt="Apple Logo" className="absolute left-4 h-5 w-5" />
              <span className="text-sm font-medium leading-[100%] text-[#252014]">Continue with Apple</span>
            </button>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
                className="flex h-10 w-[297px] cursor-pointer items-center justify-center rounded-lg border-none bg-[#24B5F8] px-4 py-2 shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span className="text-sm font-semibold text-white">Sign in</span>
                )}
              </button>

              {error && <p className="text-center text-xs text-red-600">{error}</p>}

              <div className="flex items-center justify-center gap-1">
                <p className="text-sm text-[#9FA5A8]">Don't have an account?</p>
                <Link
                  to={
                    searchParams.get('invite_token')?.trim()
                      ? `/register?invite_token=${encodeURIComponent(searchParams.get('invite_token')!.trim())}`
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
          <span className="cursor-default text-[#252014] underline opacity-80">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}
