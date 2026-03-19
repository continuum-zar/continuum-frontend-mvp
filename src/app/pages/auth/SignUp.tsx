import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export function SignUp() {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError } = useAuthStore();
    const [localLoading, setLocalLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
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
            navigate('/dashboard');
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

        // Clear error for the field being edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden text-foreground">
            {/* Background dynamic blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-card/90 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-xl relative z-10 transition-all duration-500 hover:shadow-primary/5">

                {/* Left Side - Visuals */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/50 relative overflow-hidden border-r border-border">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] opacity-[0.03] dark:opacity-10 bg-cover bg-center mix-blend-overlay"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-foreground mb-2">Continuum</h2>
                        <p className="text-muted-foreground font-medium">Elevate your workflow.</p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <blockquote className="text-xl font-medium leading-relaxed text-foreground">
                            "Joining Continuum has completely transformed how our team manages projects. The intuitive design and powerful features are unmatched."
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/20 p-[2px]">
                                <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">SA</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-foreground">Sarah Anderson</div>
                                <div className="text-xs text-muted-foreground">Product Manager, TechCorp</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 lg:p-12 flex flex-col justify-center relative bg-card">
                    <div className="max-w-md w-full mx-auto space-y-8">
                        <div className="text-center lg:text-left">
                            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Create an account</h1>
                            <p className="text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
                        </div>

                        {(error || Object.keys(errors).length > 0) && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-sm font-medium">
                                    {error || 'Please correct the highlighted errors below.'}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        disabled={isLoading || localLoading}
                                        className="bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-11 disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        disabled={isLoading || localLoading}
                                        className="bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-11 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className={`${errors.email ? 'text-destructive' : 'text-foreground'}`}>Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                    disabled={isLoading || localLoading}
                                    className={`bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-11 disabled:opacity-50 ${errors.email ? 'border-destructive ring-destructive/20' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className={`${errors.password ? 'text-destructive' : 'text-foreground'}`}>Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    required
                                    disabled={isLoading || localLoading}
                                    className={`bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-11 disabled:opacity-50 ${errors.password ? 'border-destructive ring-destructive/20' : ''}`}
                                />
                                {errors.password && (
                                    <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className={`${errors.confirmPassword ? 'text-destructive' : 'text-foreground'}`}>Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    required
                                    disabled={isLoading || localLoading}
                                    className={`bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-11 disabled:opacity-50 ${errors.confirmPassword ? 'border-destructive ring-destructive/20' : ''}`}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-md font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-xl mt-4"
                                disabled={isLoading || localLoading}
                            >
                                {isLoading || localLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
