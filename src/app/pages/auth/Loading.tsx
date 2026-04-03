import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { resolveDefaultBoardPath } from '@/lib/defaultBoardPath';

const LOADING_DURATION_MS = 2500;

export function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const minDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, LOADING_DURATION_MS);
    });
    const pathPromise = resolveDefaultBoardPath();
    let cancelled = false;

    Promise.all([minDelay, pathPromise])
      .then(([, path]) => {
        if (!cancelled) navigate(path, { replace: true });
      })
      .catch(() => {
        if (!cancelled) navigate('/dashboard-placeholder/get-started', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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

      <style>{`
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
