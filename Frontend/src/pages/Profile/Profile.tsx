import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Hash, Shield, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UpdateProfileModal from "@/components/Forms/user/UpdateProfileModal";
import UpdatePasswordModal from "@/components/Forms/user/UpdatePasswordModal";
import { format } from "date-fns";
import { useLocation, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { getImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { memo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

// Memoized InfoItem component for better performance
const InfoItem = memo(({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{value}</p>
        </div>
    </div>
));
InfoItem.displayName = "InfoItem";

// Memoized InfoItemSkeleton component
const InfoItemSkeleton = memo(() => (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
        <Skeleton className="h-5 w-5 mt-1" />
        <div className="w-full">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-full" />
        </div>
    </div>
));
InfoItemSkeleton.displayName = "InfoItemSkeleton";

const Profile = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    useEffect(() => {
        if (location.state?.showToast) {
            toast.error(location.state.message);
            // Clear the state to prevent showing the toast again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    const { userId } = useParams();
    const { profileUser, isLoading, error, isOwnProfile, refetch } = useProfile(userId);

    const formatDate = useCallback((dateString?: string, formatString: string = "PPP 'at' p") => {
        if (!dateString) return "Not available";

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }

            return format(date, formatString);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date format";
        }
    }, []);

    const handleRetry = useCallback(() => {
        refetch();
    }, [refetch]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {isLoading ? (
                                <Skeleton className="h-8 w-40" />
                            ) : (
                                isOwnProfile ? "My Profile" : `${profileUser?.name}'s Profile`
                            )}
                        </span>
                        <div className="flex gap-2">
                            {!isLoading && !error && (isOwnProfile || user?.role === "admin") && (
                                <>
                                    <UpdateProfileModal
                                        profileUser={profileUser}
                                        isOwnProfile={isOwnProfile}
                                        onProfileUpdated={refetch} />
                                    <UpdatePasswordModal isOwnProfile={isOwnProfile} profileUser={profileUser} />
                                </>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="rounded-full bg-destructive/10 p-3 mb-4">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
                            <p className="text-muted-foreground max-w-md mb-4">{error}</p>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={handleRetry}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Profile avatar and badges section */}
                            <div className="flex flex-col items-center gap-4">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-40 w-40 rounded-full" />
                                        <div className="text-center space-y-2">
                                            <Skeleton className="h-8 w-32 mx-auto" />
                                            <Skeleton className="h-6 w-20 mx-auto" />
                                            <Skeleton className="h-6 w-16 mx-auto" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Avatar className="h-40 w-40 border-4 border-primary/10">
                                            <AvatarImage
                                                src={profileUser?.image ? getImageUrl(profileUser.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser?.name || 'User')}`}
                                                className="object-cover"
                                                alt={profileUser?.name || 'User profile'}
                                            />
                                            <AvatarFallback>{profileUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-semibold">{profileUser?.name}</h2>
                                            <Badge variant="secondary" className="capitalize">
                                                {profileUser?.role}
                                            </Badge>
                                            <Badge
                                                variant={profileUser?.isActive ? "outline" : "destructive"}
                                            >
                                                {profileUser?.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile details grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoading ? (
                                    Array(6).fill(0).map((_, index) => (
                                        <InfoItemSkeleton key={index} />
                                    ))
                                ) : (
                                    <>
                                        <InfoItem
                                            icon={Mail}
                                            label="Email Address"
                                            value={profileUser?.email || "Not provided"}
                                        />
                                        <InfoItem
                                            icon={Phone}
                                            label="Phone Number"
                                            value={profileUser?.phoneNumber || "Not provided"}
                                        />
                                        <InfoItem
                                            icon={Hash}
                                            label="Matricule Number"
                                            value={profileUser?.matriculeNumber?.toString() || "Not provided"}
                                        />
                                        <InfoItem
                                            icon={Shield}
                                            label="Role"
                                            value={profileUser?.role || "Not specified"}
                                        />
                                        <InfoItem
                                            icon={Calendar}
                                            label="Account Created"
                                            value={formatDate(profileUser?.createdAt)}
                                        />
                                        <InfoItem
                                            icon={Clock}
                                            label="Last Updated"
                                            value={formatDate(profileUser?.updatedAt)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;