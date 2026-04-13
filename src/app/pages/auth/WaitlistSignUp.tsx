import { useState } from 'react';
import '@/styles/load-decorative-fonts';
import { Link, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { checkEmailExists } from '@/api/auth';

export function WaitlistSignUp() {
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
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#B2E6F7] to-[#FDFBF7]">
      <div className="mx-auto flex w-[345px] flex-col items-center gap-4 pt-[191px]">
        <div className="w-full overflow-hidden rounded-2xl border border-[#F5F5F5] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
          <div className="flex flex-col items-center border-b border-[#F5F5F5] bg-white px-6 pb-6 pt-9">
            <div className="flex flex-col items-center gap-3 text-center text-[#252014]">
              <p className="font-['Sarina',sans-serif] text-[33px] leading-[37px] tracking-[-0.66px]">Continuum</p>
              <p className="font-['Sathu:Regular',sans-serif] text-xs tracking-[-0.12px] opacity-80">Time track with one click.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-[#F9FBFB] px-6 pb-9 pt-6">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  aria-disabled="true"
                  title="Google sign-in is not available yet"
                  onClick={(e) => e.preventDefault()}
                  className="relative flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#E9E9E9] bg-white px-4"
                >
                  <img src="/auth/google.svg" alt="Google" className="absolute left-[9px] h-5 w-5" />
                  <span className="text-sm font-medium text-[#252014]">Continue with Google</span>
                </button>

                <button
                  type="button"
                  aria-disabled="true"
                  title="Apple sign-in is not available yet"
                  onClick={(e) => e.preventDefault()}
                  className="relative flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#E9E9E9] bg-white px-4"
                >
                  <img src="/auth/apple.svg" alt="Apple" className="absolute left-2 h-5 w-5" />
                  <span className="text-sm font-medium text-[#252014]">Continue with Apple</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium text-[#151515]">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="What’s your email address?"
                    required
                    className="h-10 w-full rounded-lg border border-[#E9E9E9] bg-white px-4 text-sm font-medium text-[#151515] outline-none placeholder:text-[#9FA5A8]"
                  />
                  {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg bg-[#24B5F8] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Continue with email'}
                </button>
                {submitError && (
                  <p className="text-xs text-red-600">{submitError}</p>
                )}
              </form>
            </div>

            <p className="w-full text-center text-sm font-medium text-[#9FA5A8]">
              Have an account?{' '}
              <Link to="/login" className="text-[#151515] no-underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="px-4 text-center text-xs font-medium text-[#6B7276]">
          By clicking "Sign in" or "Continue" above, you acknowledge that you have read and understood, and agree to
          Continuum&apos;s <span className="underline">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}
