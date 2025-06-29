import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { ReactNode } from "react";
import { Task, TaskFormData } from "@/types/task";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { taskService } from "@/services/taskService";

const taskFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    beginDate: z.date(),
    endDate: z.date(),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]),
    status: z.enum(["To Do", "In Progress", "In Review", "Completed"]),
    assignedTo: z.array(z.string()).min(1, "At least one technician must be assigned"),
    projectId: z.string(),
    files: z.any().optional(),
    attachmentsToKeep: z.array(z.string()).optional(),
}).refine(data => data.endDate >= data.beginDate, {
    message: "End date must be after or equal to begin date",
    path: ["endDate"],
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
    triggerMessage: ReactNode;
    task?: Task;
    projectId: string;
    onSuccess?: () => void;
}

const TaskFormModal = ({ triggerMessage, task, projectId, onSuccess }: TaskFormModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // Fetch technicians (users with technician role)
    const { users: technicians, isLoading: isLoadingTechnicians } = useUsers({ role: 'technician' });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: task
            ? {
                name: task.name,
                description: task.description,
                beginDate: new Date(task.beginDate),
                endDate: new Date(task.endDate),
                priority: task.priority,
                status: task.status,
                assignedTo: task.assignedTo.map(user =>
                    typeof user === 'string' ? user : user._id
                ),
                projectId: typeof task.project === 'string' ? task.project : task.project._id,
                attachmentsToKeep: task.attachments.map(att => att._id),
            }
            : {
                name: "",
                description: "",
                beginDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                priority: "Medium",
                status: "To Do",
                assignedTo: [],
                projectId: projectId,
            },
    });

    const beginDate = watch('beginDate');
    const endDate = watch('endDate');
    const watchedFiles = watch('files');

    // Initialize selected technicians from task data
    useEffect(() => {
        if (task) {
            const techIds = task.assignedTo.map(user =>
                typeof user === 'string' ? user : user._id
            );
            setSelectedTechnicians(techIds);
            setValue('assignedTo', techIds);
        }
    }, [task, setValue]);

    // Handle technician selection
    const handleTechnicianToggle = (techId: string) => {
        setSelectedTechnicians(prev => {
            const isSelected = prev.includes(techId);
            const newSelection = isSelected
                ? prev.filter(id => id !== techId)
                : [...prev, techId];

            setValue('assignedTo', newSelection);
            return newSelection;
        });
    };

    const onSubmit = async (data: TaskFormValues) => {
        try {
            setIsSubmitting(true);
            const formData = new FormData();

            // Add basic fields
            formData.append('name', data.name);
            formData.append('description', data.description);
            formData.append('beginDate', data.beginDate.toISOString());
            formData.append('endDate', data.endDate.toISOString());
            formData.append('priority', data.priority);
            formData.append('status', data.status);
            formData.append('projectId', data.projectId);

            // Add assigned technicians
            data.assignedTo.forEach(techId => {
                formData.append('assignedTo', techId);
            });

            // Add files if any
            if (data.files && data.files.length > 0) {
                for (let i = 0; i < data.files.length; i++) {
                    formData.append('files', data.files[i]);
                }
            }

            // Add attachments to keep if editing
            if (task && data.attachmentsToKeep) {
                data.attachmentsToKeep.forEach(attId => {
                    formData.append('attachmentsToKeep', attId);
                });
            }

            if (task) {
                // Update existing task
                await taskService.updateTask(task._id, formData);
                toast.success("Task updated successfully");
            } else {
                // Create new task
                await taskService.createTask(formData);
                toast.success("Task created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
            setOpen(false);
            reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while ${task ? 'updating' : 'creating'} the task`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (open) {
            // Reset form when dialog opens
            if (task) {
                reset({
                    name: task.name,
                    description: task.description,
                    beginDate: new Date(task.beginDate),
                    endDate: new Date(task.endDate),
                    priority: task.priority,
                    status: task.status,
                    assignedTo: task.assignedTo.map(user =>
                        typeof user === 'string' ? user : user._id
                    ),
                    projectId: typeof task.project === 'string' ? task.project : task.project._id,
                    attachmentsToKeep: task.attachments.map(att => att._id),
                });
                setSelectedTechnicians(task.assignedTo.map(user =>
                    typeof user === 'string' ? user : user._id
                ));
            } else {
                reset({
                    name: "",
                    description: "",
                    beginDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                    priority: "Medium",
                    status: "To Do",
                    assignedTo: [],
                    projectId: projectId,
                });
                setSelectedTechnicians([]);
            }
        }
    }, [open, task, reset, projectId]);

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
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Task Name*</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && (
                            <span className="text-sm text-red-500">{errors.name.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="description">Description*</Label>
                        <Textarea id="description" {...register("description")} rows={4} />
                        {errors.description && (
                            <span className="text-sm text-red-500">{errors.description.message}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Begin Date*</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !beginDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {beginDate ? format(beginDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={beginDate}
                                        onSelect={(date) => date && setValue('beginDate', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.beginDate && (
                                <span className="text-sm text-red-500">{errors.beginDate.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>End Date*</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => date && setValue('endDate', date)}
                                        initialFocus
                                        disabled={(date) => date < beginDate}
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.endDate && (
                                <span className="text-sm text-red-500">{errors.endDate.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Priority*</Label>
                            <Select
                                defaultValue={task?.priority || "Medium"}
                                onValueChange={(value) => setValue('priority', value as any)}
                            >
                                <SelectTrigger>
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
                            <Label>Status*</Label>
                            <Select
                                defaultValue={task?.status || "To Do"}
                                onValueChange={(value) => setValue('status', value as any)}
                            >
                                <SelectTrigger>
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
                        <Label>Assigned Technicians*</Label>
                        <ScrollArea className="h-[200px] border rounded-md p-4">
                            {isLoadingTechnicians ? (
                                <div>Loading technicians...</div>
                            ) : technicians?.length ? (
                                <div className="space-y-2">
                                    {technicians.map(tech => (
                                        <div key={tech._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tech-${tech._id}`}
                                                checked={selectedTechnicians.includes(tech._id)}
                                                onCheckedChange={() => handleTechnicianToggle(tech._id)}
                                            />
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={tech.image} />
                                                    <AvatarFallback>
                                                        {tech.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Label htmlFor={`tech-${tech._id}`} className="cursor-pointer">
                                                    {tech.name}
                                                </Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>No technicians available</div>
                            )}
                        </ScrollArea>
                        {errors.assignedTo && (
                            <span className="text-sm text-red-500">{errors.assignedTo.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Attachments</Label>
                        <Input
                            type="file"
                            multiple
                            {...register("files")}
                        />
                        {watchedFiles && watchedFiles.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                {Array.from(watchedFiles).map((file: any, index) => (
                                    <div key={index}>{file.name}</div>
                                ))}
                            </div>
                        )}

                        {task && task.attachments.length > 0 && (
                            <div className="mt-2">
                                <Label>Current Attachments</Label>
                                <div className="mt-1 space-y-1">
                                    {task.attachments.map(att => (
                                        <div key={att._id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`att-${att._id}`}
                                                defaultChecked
                                                onCheckedChange={(checked) => {
                                                    const current = watch('attachmentsToKeep') || [];
                                                    if (checked) {
                                                        setValue('attachmentsToKeep', [...current, att._id]);
                                                    } else {
                                                        setValue('attachmentsToKeep', current.filter(id => id !== att._id));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`att-${att._id}`} className="cursor-pointer">
                                                {att.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default TaskFormModal;