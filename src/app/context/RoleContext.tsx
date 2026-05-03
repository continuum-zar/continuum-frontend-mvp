import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { mapBackendRole } from '@/lib/utils/roleMapping';

export type Role = 'Admin' | 'Project Manager' | 'Developer' | 'Client';

interface RoleContextType {
    role: Role;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
    const userRole = useAuthStore((state) => state.user?.role);

    // Default to Project Manager
    const role = useMemo<Role>(
        () => (userRole ? mapBackendRole(userRole) : 'Project Manager'),
        [userRole]
    );
    const value = useMemo(() => ({ role }), [role]);

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
