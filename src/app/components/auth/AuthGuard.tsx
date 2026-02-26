import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/app/components/ui/skeleton';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading, accessToken, checkAuth } = useAuthStore();
    const location = useLocation();
    const [isInitCheck, setIsInitCheck] = useState(() => !!(accessToken && !isAuthenticated));

    useEffect(() => {
        let mounted = true;

        const verify = async () => {
            if (accessToken && !isAuthenticated) {
                try {
                    await checkAuth();
                } catch (error) {
                    console.error('Auth verification failed', error);
                }
            }
            if (mounted) {
                setIsInitCheck(false);
            }
        };

        verify();

        return () => {
            mounted = false;
        };
    }, [accessToken, isAuthenticated, checkAuth]);

    const showLoader = isLoading || isInitCheck;

    if (showLoader) {
        return (
            <div className="flex flex-col space-y-3 p-8">
                <Skeleton className="h-[125px] w-[250px] rounded-xl" />
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
