import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useState } from "react";
import { DatePicker } from "@/components/DatePicker";

const ProjectsEditModal = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <Edit className="text-green-700" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-right"> Project name</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Entreprise</Label>
              <Input className="col-span-3" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label>Start Date:</Label>
              <div>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>End Date:</Label>
              <div>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <Label>Status:</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Status 1</SelectItem>
                  <SelectItem value="S2">Status 2</SelectItem>
                  <SelectItem value="S3">Status 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Responsable :</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Responsable 1</SelectItem>
                  <SelectItem value="S2">Responsable 2</SelectItem>
                  <SelectItem value="S3">Responsable 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Client :</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Client 1</SelectItem>
                  <SelectItem value="S2">Client 2</SelectItem>
                  <SelectItem value="S3">Client 3</SelectItem>
                </SelectContent>
              </Select>
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

export default ProjectsEditModal;
