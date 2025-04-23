import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { ReactNode } from "react";
import { User } from "@/types/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService } from "@/services/userService";
import { useQueryClient } from "@tanstack/react-query";

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  matriculeNumber: z.string().min(1, "Matricule number is required"),
  role: z.enum(["client", "project manager", "stock manager", "technician", "admin"] as const),
  image: z.any().optional(),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  triggerMessage: ReactNode;
  user?: User;
}

const UserFormModal = ({ triggerMessage, user }: UserFormModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        matriculeNumber: String(user.matriculeNumber), // Convert number to string
        role: user.role,
        isActive: user.isActive,
      }
      : {
        isActive: true,
      },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "image") {
          if (value?.[0]) formData.append("image", value[0]);
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (user) {
        await userService.updateUser(user._id, formData);
        toast.success("User updated successfully");
      } else {
        await userService.createUser(formData);
        toast.success("User created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      reset();
    } catch (error) {
      // More specific error handling
      if (error instanceof Error) {
        // Display the specific error message from the server
        toast.error(error.message);
      } else {
        toast.error(`An unexpected error occurred while ${user ? 'updating' : 'creating'} the user`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerMessage}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? `Edit ${user.role}` : "Add User"}</DialogTitle>
          <DialogDescription>

          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Full name</Label>
              <Input {...register("name")} />
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name.message?.toString()}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Phone number</Label>
              <Input {...register("phoneNumber")} />
              {errors.phoneNumber && (
                <span className="text-sm text-red-500">
                  {errors.phoneNumber.message?.toString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Email</Label>
              <Input {...register("email")} />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email.message?.toString()}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">N°</Label>
              <Input {...register("matriculeNumber")} />
              {errors.matriculeNumber && (
                <span className="text-sm text-red-500">
                  {errors.matriculeNumber.message?.toString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Role</Label>
              <Select
                value={user?.role}
                onValueChange={(value) => setValue("role", value as UserFormValues["role"])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="project manager">Project Manager</SelectItem>
                  <SelectItem value="stock manager">Stock Manager</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <span className="text-sm text-red-500">{errors.role.message?.toString()}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Picture (optional)</Label>
            <Input type="file" {...register("image")} accept="image/*" />
            {errors.image && (
              <span className="text-sm text-red-500">
                {errors.image.message?.toString()}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Loading..." : user ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
