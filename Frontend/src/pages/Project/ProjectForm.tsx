import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/DatePicker";
import { useState } from "react";
import { Link } from "react-router-dom";

const ProjectForm = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
            <div className="flex flex-col gap-2">
              <Label className="text-right"> Project name</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Entreprise</Label>
              <Input className="col-span-3" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
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
          <div className="flex flex-col items-center">
            <Label>Days Lefte</Label>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
            <div className="flex flex-col gap-2">
              <Label>Project Manager :</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">PM 1</SelectItem>
                  <SelectItem value="S2">PM 2</SelectItem>
                  <SelectItem value="S3">PM 3</SelectItem>
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
      </CardContent>
      <CardFooter className="flex flex-row justify-center gap-10 md:gap-25 lg:gap-45 xl:gap-50">
        <Link to={`/projects`}>
          <Button>Cancel</Button>
        </Link>
        <Button type="submit">Save</Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectForm;
