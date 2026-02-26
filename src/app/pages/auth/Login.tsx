import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden text-foreground">
      {/* Background dynamic blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-info/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-card/90 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-xl relative z-10 transition-all duration-500 hover:shadow-primary/5">

        {/* Left Side - Visuals */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/50 relative overflow-hidden border-r border-border order-2 lg:order-1">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop')] opacity-[0.03] dark:opacity-10 bg-cover bg-center mix-blend-overlay"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">Continuum</h2>
            <p className="text-muted-foreground font-medium">Welcome back.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col items-start gap-3">
              <div className="h-1 bg-primary w-12 rounded-full mb-2"></div>
              <h3 className="text-2xl font-semibold text-foreground">Streamline your deep work</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Log in to experience our revolutionary suite of powerful tools designed to help you stay focused, connected, and endlessly productive.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center relative bg-card order-1 lg:order-2">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Sign in</h1>
              <p className="text-muted-foreground">Enter your credentials to access the dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-12 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link
                    to="/reset-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-input-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-12 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-border text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer font-medium hover:text-foreground transition-colors select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium p-3 bg-destructive/10 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-md font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-xl mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground space-y-4">
              <div>
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
