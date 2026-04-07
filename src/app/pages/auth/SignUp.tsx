import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export function SignUp() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { register, isLoading, error, clearError } = useAuthStore();
    const emailFromSignUp = (location.state as { email?: string } | null)?.email ?? '';
    const [localLoading, setLocalLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(emailFromSignUp);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    useEffect(() => {
        // Clear errors when navigating away or unmounting
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

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        // Confirm password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) {
            return;
        }

        setLocalLoading(true);

        try {
            await register({
                first_name: firstName,
                last_name: lastName,
                email,
                password
            });
            navigate('/onboarding/usage', { replace: true });
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleInputChange = (field: keyof typeof errors, value: string) => {
        if (field === 'email') setEmail(value);
        if (field === 'password') setPassword(value);
        if (field === 'confirmPassword') setConfirmPassword(value);

        // Clear error for the field being edited (omit key so banner/keys stay in sync)
        if (errors[field]) {
            setErrors(prev => {
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

                <form onSubmit={handleSubmit} className="flex w-[345px] flex-col gap-6 bg-white px-6 pb-9 pt-6">
                    <div className="flex w-[297px] flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium leading-[100%] text-[#151515]">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            disabled={isLoading || localLoading}
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
                            disabled={isLoading || localLoading}
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
                            disabled={isLoading || localLoading}
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
                            disabled={isLoading || localLoading}
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
                            disabled={isLoading || localLoading}
                            className={`h-10 w-[297px] rounded-lg border bg-white px-4 py-2 text-sm text-[#151515] outline-none ${errors.confirmPassword ? 'border-destructive' : 'border-[#E9E9E9]'}`}
                        />
                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || localLoading}
                        className="flex h-10 w-[297px] cursor-pointer items-center justify-center rounded-lg border-none bg-[#24B5F8] px-4 py-2 shadow-[0px_3px_9.3px_0px_rgba(44,158,249,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading || localLoading ? (
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
            </div>
        </div>
    );
}
