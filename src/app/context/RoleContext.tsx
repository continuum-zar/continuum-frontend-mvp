import { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'Project Manager' | 'Developer' | 'Client';

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
    // Default to Project Manager
    const [role, setRole] = useState<Role>('Project Manager');

    return (
        <RoleContext.Provider value={{ role, setRole }}>
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
