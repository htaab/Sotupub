import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getImageUrl } from "@/lib/utils";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/auth";

interface UpdateProfileModalProps {
    profileUser?: User | null;
    isOwnProfile?: boolean;
    onProfileUpdated?: () => void;
}

const profileFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    image: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const UpdateProfileModal = ({ profileUser, isOwnProfile = true, onProfileUpdated }: UpdateProfileModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user: currentUser, updateUser } = useAuthStore();

    // Determine which user data to use
    const userToEdit = isOwnProfile ? currentUser : profileUser;

    const [imagePreview, setImagePreview] = useState<string | undefined>(
        userToEdit?.image ? getImageUrl(userToEdit.image) : undefined
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        setValue,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: userToEdit?.name || "",
            email: userToEdit?.email || "",
            phoneNumber: userToEdit?.phoneNumber || "",
        },
    });

    // Reset form when user changes or modal opens
    useEffect(() => {
        if (open && userToEdit) {
            reset({
                name: userToEdit.name || "",
                email: userToEdit.email || "",
                phoneNumber: userToEdit.phoneNumber || "",
            });
            setImagePreview(userToEdit.image ? getImageUrl(userToEdit.image) : undefined);
        }
    }, [open, userToEdit, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                e.target.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload an image file");
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setValue("image", [file], { shouldDirty: true });
        } else {
            setImagePreview(userToEdit?.image ? getImageUrl(userToEdit.image) : undefined);
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        if (!userToEdit?._id) return;

        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Add form fields to FormData
            Object.entries(data).forEach(([key, value]) => {
                if (key === "image") {
                    if (value?.[0]) formData.append("image", value[0]);
                } else if (value !== undefined) {
                    formData.append(key, String(value));
                }
            });

            // Call API to update profile
            const updatedUser = await userService.updateProfile(userToEdit._id, formData);
            // If updating own profile, update the auth store
            if (isOwnProfile) {
                updateUser(updatedUser);
            } else if (onProfileUpdated) {
                // If updating another user's profile, call the callback to refresh data
                onProfileUpdated();
            }

            toast.success("Profile updated successfully");
            setOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred while updating profile");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isOwnProfile ? "Edit Profile" : `Edit ${userToEdit?.name}'s Profile`}
                    </DialogTitle>
                    <DialogDescription>
                        Update {isOwnProfile ? "your" : "the user's"} profile information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <Avatar className="size-24 cursor-pointer relative group" onClick={() => document.getElementById('profile-image')?.click()}>
                            <AvatarImage
                                src={imagePreview || (userToEdit?.image ? getImageUrl(userToEdit.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(userToEdit?.name || 'User')}`)}
                                className="object-cover"
                                alt={userToEdit?.name || "Profile picture"}
                            />
                            <AvatarFallback>{userToEdit?.name?.charAt(0) || 'U'}</AvatarFallback>
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs">Change</span>
                            </div>
                        </Avatar>
                        <input
                            type="file"
                            id="profile-image"
                            {...register("image")}
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <p className="text-sm text-muted-foreground">Click to change profile picture</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && (
                                <span className="text-sm text-destructive">{errors.name.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" {...register("email")} />
                            {errors.email && (
                                <span className="text-sm text-destructive">{errors.email.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input id="phoneNumber" {...register("phoneNumber")} />
                            {errors.phoneNumber && (
                                <span className="text-sm text-destructive">{errors.phoneNumber.message}</span>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isDirty}
                            className="flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateProfileModal;