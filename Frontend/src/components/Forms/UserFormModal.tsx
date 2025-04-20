import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ReactNode } from "react";
import { User } from "@/types/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormModalProps {
  triggerMessage: ReactNode;
  user?: User;
}

const UserFormModal = ({ triggerMessage, user }: UserFormModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{triggerMessage}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? `edit ${user.role}` : "Add user"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Full name</Label>
              <Input className="col-span-3" value={user?.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Phone number</Label>
              <Input className="col-span-3" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Email</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Password</Label>
              <Input className="col-span-3" placeholder="new password" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">N°</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Role</Label>
              <Select defaultValue={user?.role}>
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
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label>Picture (optional)</Label>
              <Input id="picture" type="file" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">{user ? "Save Changes" : "Add User"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
