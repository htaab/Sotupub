import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { userService } from "@/services/userService";
import { User } from "@/types/auth";

interface UpdatePasswordModalProps {
    profileUser?: User | null;
    isOwnProfile?: boolean;
}

// Create two different schemas - one for own profile (requires current password)
// and one for admin changing other users' passwords (doesn't require current password)
const ownPasswordFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const adminPasswordFormSchema = z.object({
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type OwnPasswordFormValues = z.infer<typeof ownPasswordFormSchema>;
type AdminPasswordFormValues = z.infer<typeof adminPasswordFormSchema>;

const UpdatePasswordModal = ({ profileUser, isOwnProfile = true }: UpdatePasswordModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user: currentUser } = useAuthStore();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Determine which user to update
    const userToUpdate = isOwnProfile ? currentUser : profileUser;
    const isAdmin = currentUser?.role === 'admin';

    // Use the appropriate form schema based on whether it's the user's own profile
    // or an admin changing another user's password
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(isOwnProfile ? ownPasswordFormSchema : adminPasswordFormSchema),
        defaultValues: isOwnProfile 
            ? {
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }
            : {
                newPassword: "",
                confirmPassword: "",
              },
    });

    const onSubmit = async (data: OwnPasswordFormValues | AdminPasswordFormValues) => {
        if (!userToUpdate?._id) return;

        try {
            setIsSubmitting(true);

            if (isOwnProfile) {
                // Update own password (requires current password)
                const ownData = data as OwnPasswordFormValues;
                await userService.updatePassword(userToUpdate._id, {
                    currentPassword: ownData.currentPassword,
                    newPassword: ownData.newPassword,
                });
            } else if (isAdmin) {
                // Admin updating another user's password (doesn't require current password)
                const adminData = data as AdminPasswordFormValues;
                await userService.adminResetPassword(userToUpdate._id, {
                    newPassword: adminData.newPassword,
                });
            }

            toast.success(`Password ${isOwnProfile ? 'updated' : 'reset'} successfully`);
            setOpen(false);
            reset();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while ${isOwnProfile ? 'updating' : 'resetting'} password`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Key className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isOwnProfile ? "Change Password" : `Reset Password for ${userToUpdate?.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        {isOwnProfile 
                            ? "Update your account password. After saving, you'll need to use the new password to log in."
                            : `Reset the password for ${userToUpdate?.name}. They will need to use this new password to log in.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        {isOwnProfile && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        {...register("currentPassword")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.currentPassword && (
                                    <span className="text-sm text-destructive">{errors.currentPassword.message}</span>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    {...register("newPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.newPassword && (
                                <span className="text-sm text-destructive">{errors.newPassword.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register("confirmPassword")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="text-sm text-destructive">{errors.confirmPassword.message}</span>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Updating..." : isOwnProfile ? "Update Password" : "Reset Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdatePasswordModal;