import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../ui/dialog";
import { Switch } from "@/components/ui/switch";
import { User } from "@/types/auth";
import { userService } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";

interface ToggleUserStatusModalProps {
    user: User;
}

const ToggleUserStatusModal = ({ user }: ToggleUserStatusModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const handleToggle = async () => {
        try {
            setIsSubmitting(true);
            await userService.toggleUserActive(user._id);
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred while updating user status");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Switch
                    id={`${user._id}-status-switch`}
                    checked={user.isActive}
                    className={`${user.isActive ? "bg-primary" : "bg-accent"}`}
                />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Status Change</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to {user.isActive ? 'deactivate' : 'activate'} this user?
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-2">
                    {user.isActive
                        ? "This user will no longer be able to access the system."
                        : "This will restore the user's access to the system."
                    }
                </p>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={user.isActive ? "destructive" : "default"}
                        onClick={handleToggle}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Loading..." : user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ToggleUserStatusModal;