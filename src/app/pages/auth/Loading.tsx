import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  SESSION_INVITE_TOKEN_KEY,
  SESSION_POST_ONBOARDING_WELCOME_KEY,
} from '@/app/components/welcome/welcomeModalAssets';
import { resolveDefaultBoardPath } from '@/lib/defaultBoardPath';

const LOADING_DURATION_MS = 2500;

export function Loading() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const navState = location.state as { from?: string; inviteToken?: string } | null;
    const fromOnboarding = navState?.from === 'onboarding';
    const fromLogin = navState?.from === 'login';
    let inviteToken: string | null = null;
    try {
      inviteToken =
        (typeof navState?.inviteToken === 'string' && navState.inviteToken.trim() !== ''
          ? navState.inviteToken.trim()
          : null) ?? sessionStorage.getItem(SESSION_INVITE_TOKEN_KEY);
    } catch {
      inviteToken = null;
    }

    const minDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, LOADING_DURATION_MS);
    });
    const pathPromise = resolveDefaultBoardPath();
    let cancelled = false;

    const afterNavigateWelcomeBack = () => {
      if (!fromLogin) return;
      // Run after Loading unmounts and the next screen has painted (avoid toast on top of loading UI).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.success('Welcome back!');
        });
      });
    };

    Promise.all([minDelay, pathPromise])
      .then(([, path]) => {
        if (!cancelled) {
          if (fromOnboarding) {
            sessionStorage.setItem(SESSION_POST_ONBOARDING_WELCOME_KEY, '1');
          }
          if (inviteToken && fromLogin) {
            navigate(`/invite?token=${encodeURIComponent(inviteToken)}`, { replace: true });
          } else {
            navigate(path, { replace: true });
          }
          afterNavigateWelcomeBack();
        }
      })
      .catch(() => {
        if (!cancelled) {
          if (fromOnboarding) {
            sessionStorage.setItem(SESSION_POST_ONBOARDING_WELCOME_KEY, '1');
          }
          if (inviteToken && fromLogin) {
            navigate(`/invite?token=${encodeURIComponent(inviteToken)}`, { replace: true });
          } else {
            navigate('/dashboard-placeholder/get-started', { replace: true });
          }
          afterNavigateWelcomeBack();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, location.state]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#A8E5FE] to-[#FAF8F4] p-10">
      <div className="flex h-[84px] w-[354px] flex-col items-center gap-[19.38px]">
        <img
          src="/auth/Wordmark_colour.svg"
          alt="Continuum Logo"
          className="h-[60px] w-[354px] animate-pulse-soft"
        />

        <p className="h-6 w-[235px] animate-pulse-soft text-center text-[19.38px] font-normal leading-[100%] tracking-[-0.19px] text-[#045980] opacity-80 [animation-delay:0.2s]">
          Time track with one click...
        </p>
      </div>
    </div>
  );
}
