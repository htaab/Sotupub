import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: readonly UserRole[]; // Make it readonly for better type safety
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, logout } = useAuthStore();
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const isValidUser = user && user._id && user.name && user.email && user.role;

    useEffect(() => {
        if (!isValidUser || (user && !user.isActive)) {
            const message = !isValidUser
                ? 'Invalid session. Please login again.'
                : 'Your account is inactive.';

            toast.error(message);
            logout();

            // Redirect after toast duration (matches toast animation)
            const timer = setTimeout(() => {
                navigate('/login', { state: { from: location } });
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isValidUser, user, logout, navigate, location]);

    if (!isValidUser || (user && !user.isActive)) return null;

    // Special check for profile routes
    if (location.pathname.startsWith('/profile/')) {
        // Allow admin to view all profiles
        if (user.role === 'admin') return <>{children}</>;

        // Other users can only view their own profile
        if (userId && userId !== user._id) {
            toast.error('You can only view your own profile');
            return <Navigate to={`/profile/${user._id}`} replace />;
        }
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
        toast.error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}