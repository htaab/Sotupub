import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";

const PmEditModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <Edit className="text-green-700" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pm</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right"> Project manager name</Label>
              <Input className="col-span-3" />
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
              <Label className="text-right"> N°</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Role</Label>
              <Input className="col-span-3" placeholder="PM" />
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

export default PmEditModal;
