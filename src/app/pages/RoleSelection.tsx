import { useNavigate } from 'react-router';
import { WORKSPACE_BASE } from '@/lib/workspacePaths';
import { motion } from 'motion/react';
import { useRole } from '../context/RoleContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function RoleSelection() {
    const navigate = useNavigate();
    const { role } = useRole();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="border-border border-t-4 border-t-primary">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl">Your role</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Your account is set as <strong>{role}</strong>. You will see the dashboard and features for this role.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pt-4">
                        <Button
                            className="w-full"
                            onClick={() => navigate(WORKSPACE_BASE)}
                        >
                            Continue to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
