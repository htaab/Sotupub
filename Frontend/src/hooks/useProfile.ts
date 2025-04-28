import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { userService } from '@/services/userService';
import { User } from '@/types/auth';

export function useProfile(userId?: string) {
    const { user: currentUser } = useAuthStore();
    const isOwnProfile = !userId || userId === currentUser?._id;

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(!isOwnProfile);
    const [error, setError] = useState<string | null>(null);

    const fetchUserProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (isOwnProfile) {
                // If viewing own profile, use the current user data
                setProfileUser(currentUser);
            } else if (userId) {
                // If viewing another user's profile, fetch their data
                const response = await userService.getUserProfile(userId);

                setProfileUser(response);
            } else {
                throw new Error("User ID is required");
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setError(error instanceof Error ? error.message : "Failed to load user profile");
            setProfileUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId, currentUser, isOwnProfile]);

    // Initial fetch
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    return {
        profileUser,
        isLoading,
        error,
        isOwnProfile,
        refetch: fetchUserProfile
    };
}