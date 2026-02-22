import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Briefcase, Code, Building } from 'lucide-react';
import { useRole, Role } from '../context/RoleContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function RoleSelection() {
    const navigate = useNavigate();
    const { setRole } = useRole();

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        navigate('/dashboard');
    };

    const roles = [
        {
            id: 'Project Manager',
            title: 'Project Manager',
            description: 'View team metrics, velocity trends, and project health.',
            icon: Briefcase,
        },
        {
            id: 'Developer',
            title: 'Developer',
            description: 'Focus on individual performance, tasks, and commits.',
            icon: Code,
        },
        {
            id: 'Client',
            title: 'Client',
            description: 'Track project progress, billing, and health status.',
            icon: Building,
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl text-center mb-12"
            >
                <h1 className="text-4xl font-bold mb-4 tracking-tight">Select Your Role</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose a role to simulate the dashboard experience. In production, this will be determined automatically by your account type.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {roles.map((r, index) => (
                    <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className="h-full hover:border-primary transition-all cursor-pointer bg-card group border-border"
                            onClick={() => handleRoleSelect(r.id as Role)}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <r.icon className={`h-8 w-8 text-foreground`} />
                                </div>
                                <CardTitle className="text-2xl">{r.title}</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    {r.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center pt-4">
                                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                    Continue as {r.title}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
