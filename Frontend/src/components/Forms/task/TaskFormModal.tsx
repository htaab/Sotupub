import { useEffect, useState } from "react";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "../../ui/dialog";
import { ReactNode } from "react";
import { Task } from "@/types/task";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { taskService } from "@/services/taskService";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { User } from "@/types/auth";
import { userService } from "@/services/userService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker";
import { Project } from "@/types/project";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const taskFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    description: z.string().trim().min(10, "Description must be at least 10 characters"),
    beginDate: z.date(),
    endDate: z.date(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]),
    status: z.enum(["To Do", "In Progress", "In Review", "Completed"]),
    assignedTo: z.string({
        required_error: "Technicien is required",
    }).min(1, "Technicien is required"),
    projectId: z.string(),
}).refine(data => data.endDate >= data.beginDate, {
    message: "End date must be after or equal to begin date",
    path: ["endDate"],
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
    triggerMessage: ReactNode;
    task?: Task;
    project: Project | null | undefined;
}

const TaskFormModal = ({ triggerMessage, task, project }: TaskFormModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
    const queryClient = useQueryClient();

    const { handleSubmit, watch, reset, formState: { errors }, register, setValue } = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            beginDate: new Date(project?.beginDate || ""),
            endDate: new Date(project?.endDate || ""),
            priority: "Medium",
            status: "To Do",
            projectId: project?._id || "",
        },
    });

    const fetchTechnicians = async () => {
        try {
            setIsLoadingTechnicians(true);
            // Get all technicians with no pagination limit
            const response = await userService.getUsers({
                role: 'technician',
                limit: 100, // Set a high limit to get all technicians
                isActive: true // Only get active technicians
            });
            setTechnicians(response.data.users);
        } catch (error) {
            console.error('Error fetching technicians:', error);
            toast.error('Failed to load technicians');
        } finally {
            setIsLoadingTechnicians(false);
        }
    };

    // Fetch technicians when modal opens
    useEffect(() => {
        if (open) {
            fetchTechnicians();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            if (task) {
                let TechnicienId = "";
                if (task.assignedTo) {
                    TechnicienId = typeof task.assignedTo === 'string'
                        ? task.assignedTo
                        : task.assignedTo._id || "";
                }
                reset({
                    name: task.name,
                    description: task.description,
                    beginDate: new Date(task.beginDate),
                    endDate: new Date(task.endDate),
                    priority: task.priority,
                    status: task.status,
                    assignedTo: TechnicienId,
                    projectId: typeof task.project === 'string' ? task.project : task.project._id,
                });
            } else {
                reset({
                    name: "",
                    description: "",
                    beginDate: new Date(project?.beginDate || ""),
                    endDate: new Date(project?.endDate || ""),
                    priority: "Medium",
                    status: "To Do",
                    assignedTo: "",
                    projectId: project?._id,
                });
            }
        }
    }, [open, task, reset, project, technicians]);


    const onSubmit = async (data: TaskFormValues) => {
        try {
            setIsSubmitting(true);

            // Convert dates to ISO strings and prepare data as a plain object
            const requestData = {
                ...data,
                beginDate: format(data.beginDate, 'yyyy-MM-dd'),
                endDate: format(data.endDate, 'yyyy-MM-dd'),
                assignedTo: data.assignedTo || undefined,
            };

            // Remove empty assignedTo completely instead of sending empty string
            if (!requestData.assignedTo) {
                delete requestData.assignedTo;
            }

            console.log("requestData : ", requestData)

            if (task) {
                // Update existing task
                await taskService.updateTask(task._id, requestData);
                toast.success("Task updated successfully");
            } else {
                // Create new task
                await taskService.createTask(requestData);
                toast.success("Task created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["tasks", project?._id] });
            setOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while ${task ? 'updating' : 'creating'} the task`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerMessage}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{task ? `Edit Task` : "Add Task"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Update task information" : "Add a new task to the project"}
                    </DialogDescription>
                </DialogHeader>
                {/* form here */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Task Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter task name"
                            {...register("name")}
                            className="w-full"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>
                    {/* Task Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter task description"
                            className="min-h-[100px]"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                        )}
                    </div>
                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="beginDate">Start Date</Label>
                            <DatePicker
                                date={watch("beginDate")}
                                onSelect={(date) => {
                                    if (date) {
                                        setValue("beginDate", date);
                                        // If end date is before new begin date, update end date
                                        const endDate = watch("endDate");
                                        if (endDate && date > endDate) {
                                            setValue("endDate", date);
                                        }
                                    }
                                }}
                                placeholder="Select start date"
                                fromDate={new Date(project?.beginDate || "")}
                                toDate={new Date(project?.endDate || "")}
                            />
                            {errors.beginDate && (
                                <span className="text-sm text-red-500">{errors.beginDate.message?.toString()}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Label>End Date</Label>
                            <DatePicker
                                date={watch("endDate")}
                                onSelect={(date) => date && setValue("endDate", date)}
                                placeholder="Select end date"
                                fromDate={watch("beginDate") || (project ? new Date(project.beginDate) : new Date())}
                                toDate={project ? new Date(project.endDate) : undefined}
                            />
                            {errors.endDate && (
                                <span className="text-sm text-red-500">{errors.endDate.message?.toString()}</span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Priority*</Label>
                            <Select
                                defaultValue={task?.priority || "Medium"}
                                onValueChange={(value) => setValue('priority', value as 'Low' | 'Medium' | 'High' | 'Urgent')}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priority && (
                                <span className="text-sm text-red-500">{errors.priority.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Status</Label>
                            <Select
                                defaultValue={task?.status || "To Do"}
                                onValueChange={(value) => setValue('status', value as 'To Do' | 'In Progress' | 'In Review' | 'Completed')}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="To Do">To Do</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="In Review">In Review</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <span className="text-sm text-red-500">{errors.status.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Assigned Technicians</Label>
                        <Select
                            disabled={isLoadingTechnicians && technicians.length === 0}
                            value={watch("assignedTo")}
                            onValueChange={(value) => setValue("assignedTo", value)}
                        >
                            <SelectTrigger className={`w-full ${errors.assignedTo ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select Technicians" />
                            </SelectTrigger>
                            <SelectContent className="max-w-3xs">
                                <SelectGroup>
                                    <SelectLabel>Technicians</SelectLabel>
                                    {technicians.length > 0 ? (
                                        technicians.map(technician => (
                                            <SelectItem key={technician._id} value={technician._id}>
                                                {technician.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-muted-foreground text-xs sm:text-sm whitespace-normal break-words">
                                            No technicians available. Please add a technicians first.
                                        </div>
                                    )}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {errors.assignedTo && (
                            <span className="text-sm text-red-500">{errors.assignedTo.message}</span>
                        )}
                        {technicians.length === 0 && (
                            <span className="text-sm text-amber-600 mt-1">
                                No technicians available in the system
                            </span>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : task ? 'Update Task' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default TaskFormModal;