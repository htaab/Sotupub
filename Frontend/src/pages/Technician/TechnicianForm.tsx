import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

const TechnicianForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
            <div className="flex flex-col gap-2">
              <Label className="text-right"> Technician name</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Email</Label>
              <Input className="col-span-3" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
            <div className="flex flex-col gap-2">
              <Label className="text-right"> N°</Label>
              <Input className="col-span-3" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Phone number</Label>
              <Input className="col-span-3" />
            </div>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-center md:gap-25 lg:gap-32 xl:gap-45">
            <div className="flex flex-col gap-2">
              <Label>Picture</Label>
              <Input id="picture" type="file" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-right">Role</Label>
              <Input className="col-span-3" placeholder="Technician" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row justify-center gap-10 md:gap-25 lg:gap-45 xl:gap-50">
        <Link to={`/technicians`}>
          <Button>Cancel</Button>
        </Link>
        <Button type="submit">Save</Button>
      </CardFooter>
    </Card>
  );
};

export default TechnicianForm;
