import TaskFormModal from "@/components/Forms/task/TaskFormModal";
import ProjectInfo from "@/components/tasks/ProjectInfo";
import TaskBoard from "@/components/tasks/TaskBoard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/auth-store";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { useParams } from "react-router-dom";

const ProjectTasks = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    project,
    isLoadingProject,
    projectError,
    tasks,
    totalCount,
    isLoadingTasks,
    tasksError,
    refetchTasks
  } = useTasks(projectId || "");

  const { user } = useAuthStore();

  if (!projectId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Invalid Project</AlertTitle>
          <AlertDescription>No project ID was provided.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Project */}
      <ProjectInfo projectData={project} isLoadingProject={isLoadingProject} projectError={projectError} />

      {/* Tasks Section */}
      <Card className="bg-card/30 border-border/30">
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row md:justify-between">
            <div className="text-xl flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Project Tasks
              {tasks && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({Object.values(tasks).flat().length})
                </span>
              )}
            </div>
            {isLoadingTasks ? (
              <Skeleton className="h-9 px-4 py-2 w-28" />
            ) : (
              (project && user && (user.role === "admin" || user.role === "project manager")) ? (
                <TaskFormModal
                  project={project}
                  triggerMessage={
                    <Button>
                      <span className="mr-1">Add Task</span>
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              ) :
                (
                  <Button disabled>
                    <span className="mr-1">Add Task</span>
                    <Plus className="h-4 w-4" />
                  </Button>
                )
            )
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {isLoadingTasks ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : tasksError ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                There was a problem loading the tasks. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {tasks ?
                      `${Object.values(tasks).flat().filter(task => task.status === 'Completed').length} of ${totalCount} tasks completed` :
                      'No tasks available'}
                  </span>
                </div>
              </div>

              {/* Task Board Component */}
              {(tasks && Object.keys(tasks).length > 0 && project) ? (
                <TaskBoard tasks={tasks} onTaskUpdate={refetchTasks} project={project} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found for this project
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card >
    </div >
  );
};

export default ProjectTasks;
