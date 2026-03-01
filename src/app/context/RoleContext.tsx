import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { mapBackendRole } from '@/lib/utils/roleMapping';

export type Role = 'Project Manager' | 'Developer' | 'Client';

interface RoleContextType {
    role: Role;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
    const { user } = useAuthStore();
    // Default to Project Manager
    const [role, setRole] = useState<Role>('Project Manager');

    useEffect(() => {
        if (user) {
            setRole(mapBackendRole(user.role));
        } else {
            setRole('Project Manager');
        }
    }, [user]);

    return (
        <RoleContext.Provider value={{ role }}>
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
