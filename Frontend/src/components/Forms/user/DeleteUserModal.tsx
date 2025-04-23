import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "../../ui/dialog";
import { User } from "@/types/auth";
import { userService } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

interface DeleteUserModalProps {
    user: User;
}

const DeleteUserModal = ({ user }: DeleteUserModalProps) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await userService.deleteUser(user._id);
            toast.success("User deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred while deleting the user");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {user.name}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteUserModal;