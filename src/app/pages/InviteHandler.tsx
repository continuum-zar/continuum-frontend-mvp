import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { ProjectInvitationModal } from '@/app/components/ProjectInvitationModal';
import { useInvitationByToken, getApiErrorMessage } from '@/api/hooks';
import { RouteSkeleton } from '@/app/components/ui/RouteSkeleton';

export function InviteHandler() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!token) {
      navigate('/dashboard-placeholder', { replace: true });
      return;
    }
    if (!isInitialized) return;
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(SESSION_INVITE_TOKEN_KEY, token);
      } catch {
        /* ignore */
      }
      navigate(`/login?invite_token=${encodeURIComponent(token)}`, { replace: true });
    }
  }, [token, isAuthenticated, isInitialized, navigate]);

  const {
    data: invitation,
    isLoading,
    isError,
    error,
  } = useInvitationByToken(token, {
    enabled: Boolean(token) && isAuthenticated && isInitialized,
  });

  if (!token) return null;
  if (!isInitialized) return <RouteSkeleton />;
  if (!isAuthenticated) return null;

  if (isLoading) return <RouteSkeleton />;
  if (isError || !invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6">
        <p className="text-center text-sm text-destructive">
          {getApiErrorMessage(error, 'This invitation could not be loaded. It may have expired or already been used.')}
        </p>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => navigate('/dashboard-placeholder', { replace: true })}
        >
          Continue to Continuum
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectInvitationModal
        open
        onOpenChange={(open) => {
          if (!open) {
            try {
              sessionStorage.removeItem(SESSION_INVITE_TOKEN_KEY);
            } catch {
              /* ignore */
            }
            navigate('/dashboard-placeholder', { replace: true });
          }
        }}
        invitation={invitation}
      />
    </div>
  );
}
