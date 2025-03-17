import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ProjectTasks = () => {
  return (
    <div>
      <h1>Project Name</h1>
      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">To do</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">in progress</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Completed</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProjectTasks;
