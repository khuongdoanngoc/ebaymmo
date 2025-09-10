import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();
    const location = useLocation();

    // Get the current path to display in the error message
    const currentPath = location.pathname;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-2xl font-semibold">Admin Page Not Found</h2>

                <p className="text-muted-foreground mb-2">
                    The admin page you're looking for doesn't exist or has been
                    moved.
                </p>

                <div className="p-3 bg-muted rounded-lg text-sm mb-4">
                    <code>{currentPath}</code>
                </div>

                <p className="text-sm text-muted-foreground">
                    Please check the URL or navigate to an available admin
                    section using the menu.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                    <Button onClick={() => navigate(-1)} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>

                    <Button asChild>
                        <Link to="/admin/dashboard">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Admin Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
