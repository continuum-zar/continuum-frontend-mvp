import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { isAxiosError } from 'axios';
import { LEGACY_WORKSPACE_BASE, WORKSPACE_BASE } from '@/lib/workspacePaths';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isInitialized, accessToken, checkAuth } = useAuthStore();
    const location = useLocation();
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleCheckAuth = useCallback(async () => {
        setFetchError(null);
        try {
            await checkAuth();
        } catch (err: unknown) {
            // If it's a 401/403, the store clears state and we'll redirect to /login
            if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                return;
            }
            const fallback = 'Failed to authenticate. Please try again.';
            setFetchError(err instanceof Error ? err.message || fallback : fallback);
        }
    }, [checkAuth]);

    useEffect(() => {
        if (!isInitialized && accessToken && !fetchError) {
            handleCheckAuth();
        }
    }, [isInitialized, accessToken, fetchError, handleCheckAuth]);

    /** Sarina + Satoshi: onboarding, placeholder shell, and role-selection */
    useEffect(() => {
        const p = location.pathname;
        if (
            p.startsWith('/onboarding') ||
            p.startsWith(WORKSPACE_BASE) ||
            p.startsWith(LEGACY_WORKSPACE_BASE) ||
            p.startsWith('/role-selection') ||
            p.startsWith('/tasks/') ||
            p.startsWith('/projects/') ||
            p.startsWith('/cursor-mcp')
        ) {
            void import('@/styles/load-decorative-fonts');
        }
    }, [location.pathname]);

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 max-w-md mx-auto space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>
                        {fetchError}
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={handleCheckAuth}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    const showLoader = isLoading || (!isInitialized && accessToken);

    if (showLoader) {
        return (
            <div className="flex flex-col space-y-3 p-8">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
