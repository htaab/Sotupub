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
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { ReactNode } from "react";

interface DeleteEntityModalProps<T> {
    entity: T;
    entityName: string;
    entityType: string;
    deleteFunction: (id: string) => Promise<{ success: boolean; message?: string }>;
    queryKeys: readonly unknown[][];
    triggerButton?: ReactNode;
}

const DeleteEntityModal = <T extends { _id: string; name: string }>({
    entity,
    entityName,
    entityType,
    deleteFunction,
    queryKeys,
    triggerButton,
}: DeleteEntityModalProps<T>) => {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await deleteFunction(entity._id);
            if (response.success) {
                // Invalidate all provided query keys
                queryKeys.forEach(queryKey => {
                    queryClient.invalidateQueries({ queryKey });
                });

                toast.success(`${entityType} deleted successfully`);
                setOpen(false);
            } else {
                toast.error(response.message || `Failed to delete ${entityType.toLowerCase()}`);
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while deleting the ${entityType.toLowerCase()}`);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="destructive">
                        <Trash2 />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete {entityType}</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {entityName}? This action cannot be undone.
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
                        {isDeleting ? "Deleting..." : `Delete ${entityType}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteEntityModal;