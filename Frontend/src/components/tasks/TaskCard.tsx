import { Card, CardContent } from "@/components/ui/card";
import { Task } from "@/types/task";
import { Badge } from "../ui/badge";
import { useState } from "react";
import TaskModal from "./TaskModal";
import { Project } from "@/types/project";
import { useAuthStore } from "@/store/auth-store";

interface TaskCardProps {
    task: Task;
    onTaskUpdate?: () => void;
    project: Project;
}

const getTimeRemaining = (endDateStr: string) => {
    const now = new Date();
    const end = new Date(endDateStr);

    // Reset hours, minutes, seconds for date comparison
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Check if it's due today
    if (todayDate.getTime() === endDate.getTime()) {
        return "Due today";
    }

    const diff = end.getTime() - now.getTime();

    // If past due date
    if (diff < 0) {
        return "Past due";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
        return `${days}d ${hours}h remaining`;
    }
    return `${hours}h remaining`;
};

const TaskCard = ({ task, onTaskUpdate, project }: TaskCardProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuthStore();
    const isAssignedTechnician = typeof (task.assignedTo) === "string" ? task.assignedTo === user?._id : task.assignedTo._id === user?._id;

    return (
        <>
            <Card
                className={`cursor-pointer hover:shadow-md transition-shadow py-2 ${isAssignedTechnician && "border border-green-200"}`}
                onClick={() => setIsModalOpen(true)}
            >
                <CardContent className="px-3 py-0">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm line-clamp-2">{task.name}</h3>
                        <Badge variant={"secondary"}>{task.priority}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-bold">
                        {getTimeRemaining(task.endDate)}
                    </div>
                </CardContent>
            </Card>

            <TaskModal
                task={task}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskUpdate={onTaskUpdate}
                project={project}
            />
        </>
    );
};

export default TaskCard;