import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { List, Trash, FolderPlus, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectsModal from "./ProjectsModal";

const Projects = () => {
  const role = "admin";
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects List</h1>
        {role === "admin" && (
          <ProjectsModal
            message={
              <Button>
                <FolderPlus />
                Add Project
              </Button>
            }
          />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Project name</CardTitle>
              <CardDescription>Status : Staus</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <div className="mb-3">
                  Description :<div>Description Here</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Start Date : xxxxxx</div>
                  <div>End Date : XXXXXXXX</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 justify-end">
              <ProjectsModal
                message={
                  <Button variant={"outline"} size={"icon"}>
                    <Edit className="text-green-700" />
                  </Button>
                }
              />
              <Link to={`/projects/${index}/tasks`}>
                <Button variant={"outline"} size={"icon"}>
                  <List />
                </Button>
              </Link>
              <Button variant={"outline"} size={"icon"}>
                <Trash className="text-destructive" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
};

export default Projects;
