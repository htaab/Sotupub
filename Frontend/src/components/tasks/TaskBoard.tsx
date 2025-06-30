import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types/task";
import { CheckCircle, Clock, ListTodo, PlayCircle } from "lucide-react";
import TaskCard from "./TaskCard";
import { Badge } from "../ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { taskService } from "@/services/taskService";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Project } from "@/types/project";

interface TaskBoardProps {
    tasks: Record<string, Task[]>;
    onTaskUpdate?: () => void; // Callback to refresh tasks after update
    project: Project
}

// Define a type for column configuration
interface ColumnConfig {
    id: string;
    title: string;
    icon: React.ReactNode;
    tasks: Task[];
    color: string; // This is a CSS class name
}


const TaskBoard = ({ tasks, onTaskUpdate, project }: TaskBoardProps) => {
    const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>(tasks);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync local state with props when tasks change from server
    useEffect(() => {
        if (!isUpdating) {
            setLocalTasks(tasks);
        }
    }, [tasks, isUpdating]);

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination } = result;

        // If dropped outside a droppable area
        if (!destination) return;

        // If dropped in the same position
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        // Get the task being moved
        const sourceColumnId = source.droppableId;
        const destinationColumnId = destination.droppableId;

        // Map column IDs to status values
        const columnToStatus: Record<string, string> = {
            "to-do": "To Do",
            "in-progress": "In Progress",
            "in-review": "In Review",
            "completed": "Completed"
        };

        const newStatus = columnToStatus[destinationColumnId];
        const sourceStatus = columnToStatus[sourceColumnId];

        if (!newStatus || !sourceStatus) return;

        // Get the task from source column
        const sourceTasks = tasks[sourceStatus] || [];
        const taskToMove = sourceTasks[source.index];

        if (!taskToMove) return;

        // Optimistic update - immediately update local state
        const updatedTasks = { ...localTasks };
        const sourceColumn = [...updatedTasks[sourceStatus]];
        const destColumn = [...(updatedTasks[newStatus] || [])];

        // Remove from source
        const [movedTask] = sourceColumn.splice(source.index, 1);

        // Update task status
        const updatedTask = { ...movedTask, status: newStatus as Task['status'] };

        // Add to destination
        destColumn.splice(destination.index, 0, updatedTask);

        // Update local state
        updatedTasks[sourceStatus] = sourceColumn;
        updatedTasks[newStatus] = destColumn;
        setLocalTasks(updatedTasks);

        // Only update if status actually changed
        if (newStatus !== taskToMove.status) {
            setIsUpdating(true);
            try {
                await taskService.updateTaskPosition(taskToMove._id, newStatus);
                toast.success(`Task moved to ${newStatus}`);

                // Call the callback to refresh tasks
                if (onTaskUpdate) {
                    onTaskUpdate();
                }
            } catch (error) {
                console.error('Error updating task position:', error);
                toast.error(error instanceof Error ? error.message : "failed to update task position");
                // Rollback on error
                setLocalTasks(tasks);
            } finally {
                setIsUpdating(false);
            }
        }
    };

    // Define column configurations
    const columns: ColumnConfig[] = [
        {
            id: "to-do",
            title: "To Do",
            icon: <ListTodo className="h-5 w-5 mr-2 text-[#EAB308]" />,
            tasks: localTasks["To Do"] || [],
            color: "border-[#EAB308]",
        },
        {
            id: "in-progress",
            title: "In Progress",
            icon: <PlayCircle className="h-5 w-5 mr-2 text-blue-600" />,
            tasks: localTasks["In Progress"] || [],
            color: "border-blue-600",
        },
        {
            id: "in-review",
            title: "In Review",
            icon: <Clock className="h-5 w-5 mr-2 text-blue-200" />,
            tasks: localTasks["In Review"] || [],
            color: "border-blue-200",
        },
        {
            id: "completed",
            title: "Completed",
            icon: <CheckCircle className="h-5 w-5 mr-2 text-green-600" />,
            tasks: localTasks["Completed"] || [],
            color: "border-green-600",
        },
    ];

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {columns.map((column) => (
                        <div key={column.id} className="w-60 sm:w-80">
                            <Card className={`border-t-4 ${column.color} ${isUpdating ? 'opacity-50' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        {column.icon}
                                        <span className="truncate">{column.title}</span>
                                        <Badge className="ml-auto rounded-full">{column.tasks.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3">
                                    <Droppable droppableId={column.id}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="space-y-2 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto pr-2"
                                            >
                                                {column.tasks.length === 0 ? (
                                                    <div className="flex items-center justify-center h-24 border border-dashed rounded-md text-sm text-muted-foreground">
                                                        No tasks
                                                    </div>
                                                ) : (
                                                    column.tasks.map((task, index) => (
                                                        <Draggable
                                                            key={task._id}
                                                            draggableId={task._id}
                                                            index={index}
                                                        >
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <TaskCard task={task} onTaskUpdate={onTaskUpdate} project={project} />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </DragDropContext>
    );
};

export default TaskBoard;