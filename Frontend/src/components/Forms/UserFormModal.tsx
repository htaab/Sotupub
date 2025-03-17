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

interface User {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  number?: number;
  picture?: string;
}

const UserFormModal = ({
  role,
  triggerMessage,
  user,
}: {
  role: string;
  triggerMessage: ReactNode;
  user?: User;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{triggerMessage}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {role}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right">Name</Label>
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
              <Input
                disabled
                className="col-span-3"
                placeholder="PM"
                defaultValue={role}
              />
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
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
