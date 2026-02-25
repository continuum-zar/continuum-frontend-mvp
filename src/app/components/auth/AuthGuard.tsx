import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/app/components/ui/skeleton';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading, checkAuth, accessToken } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        // If we have an access token but not authenticated (e.g. after refresh), check auth
        if (accessToken && !isAuthenticated) {
            checkAuth().catch(console.error);
        }
    }, [accessToken, isAuthenticated, checkAuth]);

    if (isLoading) {
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

    if (!isAuthenticated && !accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
