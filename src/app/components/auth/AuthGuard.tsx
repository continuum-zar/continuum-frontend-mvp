import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/app/components/ui/skeleton';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isInitialized, accessToken, checkAuth } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!isInitialized && accessToken) {
            checkAuth().catch(console.error);
        }
    }, [isInitialized, accessToken, checkAuth]);

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
