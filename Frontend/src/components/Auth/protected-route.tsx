import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: readonly UserRole[]; // Make it readonly for better type safety
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const user = useAuthStore(state => state.user);
    const location = useLocation();

    // Check for empty or invalid user object
    const isValidUser = user && 
                       Object.keys(user).length > 0 && 
                       user._id && 
                       user.role && 
                       user.isActive;

    if (!isValidUser) {
        // Clear invalid auth state
        useAuthStore.getState().logout();
        return <Navigate to="/login" state={{ from: location }} />;
    }

    // Check role permissions
    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
        toast.error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}