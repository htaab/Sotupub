import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Textarea } from "../../ui/textarea";
import { ReactNode } from "react";
import { Project } from "@/types/project";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { projectService } from "@/services/projectService";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useUsers";
import { DatePicker } from "@/components/DatePicker";
import { format } from "date-fns";
import { useProducts } from "@/hooks/useProducts";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const projectFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    entreprise: z.string().min(2, "Company name must be at least 2 characters"),
    description: z.string().optional(),
    beginDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    status: z.enum(["To Do", "In Progress", "Completed", "Cancelled"], {
        required_error: "Status is required",
    }),
    client: z.string({
        required_error: "Client is required",
    }).min(1, "Client is required"),
    projectManager: z.string({
        required_error: "Project manager is required",
    }).min(1, "Project manager is required"),
    stockManager: z.string().optional(),
    products: z.array(
        z.object({
            product: z.string({
                required_error: "Product is required",
            }).min(1, "Product is required"),
            quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        })
    ).optional(),
}).refine((data) => {
    // If products exist and have items, stockManager must be provided
    if (data.products && data.products.length > 0) {
        return !!data.stockManager && data.stockManager.length > 0;
    }
    return true;
}, {
    message: "Stock manager is required when products are added",
    path: ["stockManager"]
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormModalProps {
    message: ReactNode;
    project?: Project;
}

const ProjectFormModal = ({ message, project }: ProjectFormModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const queryClient = useQueryClient();
    const { users } = useUsers();
    const { products: allProducts } = useProducts();

    const clients = users.filter(user => user.role === "client");
    const projectManagers = users.filter(user => user.role === "project manager");
    const stockManagers = users.filter(user => user.role === "stock manager");

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        control,
        getValues,
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            status: "To Do",
            products: [],
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "products",
    });

    // Set form values when project data is available
    useEffect(() => {
        if (project && open) {
            // Extract the correct IDs based on whether client/manager is a string or object
            const clientId = project.client ? (typeof project.client === 'string' ? project.client : project.client._id) : "";
            const projectManagerId = project.projectManager ? (typeof project.projectManager === 'string'
                ? project.projectManager
                : project.projectManager._id) : "";

            // Handle stockManager safely - it might be undefined
            let stockManagerId = "";
            if (project.stockManager) {
                stockManagerId = typeof project.stockManager === 'string'
                    ? project.stockManager
                    : project.stockManager._id || "";
            }

            const projectProducts = project.products?.length
                ? project.products.map(p => ({
                    product: typeof p.product === 'string' ? p.product : p.product._id,
                    quantity: p.quantity
                }))
                : [];

            // Show products section if project has products
            setShowProducts(projectProducts.length > 0);

            reset({
                name: project.name,
                entreprise: project.entreprise,
                description: project.description || "",
                beginDate: new Date(project.beginDate),
                endDate: new Date(project.endDate),
                status: project.status,
                client: clientId,
                projectManager: projectManagerId,
                stockManager: stockManagerId,
                products: projectProducts,
            });
        }
    }, [project, reset, open]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setShowProducts(false);
            reset({
                name: "",
                entreprise: "",
                description: "",
                beginDate: undefined,
                endDate: undefined,
                status: "To Do",
                client: "",
                projectManager: "",
                stockManager: "",
                products: [],
            });
        }
    }, [open, reset]);

    // Function to add a new product
    const handleAddProduct = () => {
        if (!showProducts) {
            setShowProducts(true);
        }
        append({ product: "", quantity: 1 });
    };

    const handleRemoveProduct = (index: number) => {
        remove(index);

        // Check if this was the last product and update showProducts accordingly
        if (fields.length === 1) {
            setShowProducts(false);
            setValue("stockManager", "");
        }
    };

    // Function to check if a product is already added
    const isProductAlreadyAdded = (productId: string, currentIndex: number) => {
        const products = getValues("products") || [];
        return products.some((p, idx) => p.product === productId && idx !== currentIndex);
    };

    // Function to get available quantity for a product
    const getAvailableQuantity = (productId: string) => {
        const product = allProducts?.find(p => p._id === productId);
        return product?.quantity || 0;
    };

    const onSubmit = async (data: ProjectFormValues) => {
        if (data.products && data.products.length > 0 && (!data.stockManager || data.stockManager.length === 0)) {
            // Set error manually
            setValue("stockManager", "", { shouldValidate: true });
            // Show error message
            toast.error("Stock manager is required when products are added");
            return;
        }
        try {
            setIsSubmitting(true);

            // Convert dates to ISO strings and prepare data as a plain object
            const requestData = {
                ...data,
                beginDate: format(data.beginDate, 'yyyy-MM-dd'),
                endDate: format(data.endDate, 'yyyy-MM-dd'),
                // Don't include stockManager if it's empty
                stockManager: data.stockManager || undefined,
                // Ensure products are properly formatted
                products: data.products?.map(p => ({
                    product: p.product,
                    quantity: p.quantity
                })) || []
            };

            // Remove empty stockManager completely instead of sending empty string
            if (!requestData.stockManager) {
                delete requestData.stockManager;
            }

            if (project) {
                await projectService.updateProject(project._id, requestData);
                toast.success("Project updated successfully");
            } else {
                await projectService.createProject(requestData);
                toast.success("Project created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["projects-calendar"] });
            setOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while ${project ? 'updating' : 'creating'} the project`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{message}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit Project" : "Add Project"}</DialogTitle>
                    <DialogDescription>
                        {project ? "Update project details" : "Create a new project"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5 md:flex-row">
                        <div className="flex flex-col gap-2 md:w-full">
                            <Label>Project Name</Label>
                            <Input {...register("name")} />
                            {errors.name && (
                                <span className="text-sm text-red-500">{errors.name.message}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 md:w-full">
                            <Label>Company</Label>
                            <Input {...register("entreprise")} />
                            {errors.entreprise && (
                                <span className="text-sm text-red-500">{errors.entreprise.message}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Description</Label>
                        <Textarea {...register("description")} rows={3} />
                        {errors.description && (
                            <span className="text-sm text-red-500">{errors.description.message}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-5 md:flex-row">
                        <div className="flex flex-col gap-2 w-full">
                            <Label>Start Date</Label>
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
                                fromDate={new Date()}
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
                                fromDate={watch("beginDate") || new Date()}
                            />
                            {errors.endDate && (
                                <span className="text-sm text-red-500">{errors.endDate.message?.toString()}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 md:flex-row">
                        <div className="flex flex-col gap-2 w-full">
                            <Label>Client</Label>
                            <Select
                                value={watch("client")}
                                onValueChange={(value) => setValue("client", value)}
                            >
                                <SelectTrigger className={`w-full ${errors.client ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Select Client" />
                                </SelectTrigger>
                                <SelectContent className="max-w-3xs">
                                    <SelectGroup>
                                        <SelectLabel>clients</SelectLabel>
                                        {clients.length > 0 ? (
                                            clients.map(client => (
                                                <SelectItem key={client._id} value={client._id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-muted-foreground text-xs sm:text-sm whitespace-normal break-words">
                                                No clients available. Please add a client first.
                                            </div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.client && (
                                <span className="text-sm text-red-500">{errors.client.message}</span>
                            )}
                            {clients.length === 0 && (
                                <span className="text-sm text-amber-600 mt-1">
                                    No clients available in the system
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Label>Project Manager</Label>
                            <Select
                                value={watch("projectManager")}
                                onValueChange={(value) => setValue("projectManager", value)}
                            >
                                <SelectTrigger className={`w-full ${errors.projectManager ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Select Project Manager" />
                                </SelectTrigger>
                                <SelectContent className="max-w-3xs">
                                    <SelectGroup>
                                        <SelectLabel>project Managers</SelectLabel>
                                        {projectManagers.length > 0 ? (
                                            projectManagers.map(manager => (
                                                <SelectItem key={manager._id} value={manager._id}>
                                                    {manager.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-muted-foreground text-xs sm:text-sm whitespace-normal break-words">
                                                No project managers available. Please add a project manager first.
                                            </div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.projectManager && (
                                <span className="text-sm text-red-500">{errors.projectManager.message}</span>
                            )}
                            {projectManagers.length === 0 && (
                                <span className="text-sm text-amber-600 mt-1">
                                    No project managers available in the system
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 md:flex-row">
                        <div className="flex flex-col gap-2 w-full">
                            <Label>
                                <div className="flex items-center gap-1 flex-wrap">
                                    Stock Manager
                                    {showProducts && <span className="text-xs text-red-500">*</span>}
                                </div>
                            </Label>
                            <Select
                                value={watch("stockManager")}
                                onValueChange={(value) => setValue("stockManager", value)}
                                disabled={!showProducts && !watch("stockManager")}
                            >
                                <SelectTrigger className={`w-full ${(showProducts && errors.stockManager) || errors.stockManager ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Select Stock Manager" />
                                </SelectTrigger>
                                <SelectContent className="max-w-3xs">
                                    <SelectGroup>
                                        <SelectLabel>stock Managers</SelectLabel>
                                        {stockManagers.length > 0 ? (
                                            stockManagers.map(manager => (
                                                <SelectItem key={manager._id} value={manager._id}>
                                                    {manager.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-muted-foreground text-xs sm:text-sm whitespace-normal break-words">
                                                No stock managers available. Please add a stock manager first.
                                            </div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.stockManager && (
                                <span className="text-sm text-red-500">{errors.stockManager.message}</span>
                            )}
                            {stockManagers.length === 0 && (
                                <span className="text-sm text-amber-600 mt-1">
                                    No stock managers available in the system
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Label>Status</Label>
                            <Select
                                value={watch("status")}
                                onValueChange={(value) => setValue("status", value as ProjectFormValues["status"])}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Status</SelectLabel>
                                        <SelectItem value="To Do">To Do</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <span className="text-sm text-red-500">{errors.status.message}</span>
                            )}
                        </div>
                    </div>


                    {/* Products section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <Label>Products</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddProduct}
                            >
                                {showProducts ? (
                                    <>
                                        <Plus className="h-4 w-4 mr-1" /> Add Product
                                    </>
                                ) : (
                                    <>
                                        <PackagePlus className="h-4 w-4 mr-1" /> Add Products
                                    </>
                                )}
                            </Button>
                        </div>

                        {showProducts && fields.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                                No products added. Click "Add Product" to add products to this project.
                            </div>
                        )}

                        {showProducts && fields.map((field, index) => {
                            const selectedProductId = watch(`products.${index}.product`);
                            const availableQuantity = selectedProductId ? getAvailableQuantity(selectedProductId) : 0;
                            const isDuplicate = selectedProductId && isProductAlreadyAdded(selectedProductId, index);

                            return (
                                <Card key={field.id} className={`overflow-hidden ${isDuplicate ? 'border-red-500' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <Label>Product {index + 1}</Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveProduct(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-col gap-3 md:flex-row">
                                                <div className="flex flex-col gap-2 w-full md:w-2/3">
                                                    <Label>Product</Label>
                                                    <Select
                                                        value={selectedProductId}
                                                        onValueChange={(value) => {
                                                            setValue(`products.${index}.product`, value);
                                                            // Reset quantity to 1 when product changes
                                                            setValue(`products.${index}.quantity`, 1);
                                                        }}
                                                    >
                                                        <SelectTrigger className={`w-full ${isDuplicate ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select Product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Products</SelectLabel>
                                                                {allProducts?.map(product => (
                                                                    <SelectItem
                                                                        key={product._id}
                                                                        value={product._id}
                                                                        disabled={isProductAlreadyAdded(product._id, index) || product.quantity <= 0}
                                                                    >
                                                                        {product.name} - {product.reference}
                                                                        {product.quantity > 0
                                                                            ? ` (${product.quantity} available)`
                                                                            : " (Out of stock)"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    {isDuplicate && (
                                                        <span className="text-sm text-red-500">
                                                            This product is already added to the project
                                                        </span>
                                                    )}
                                                    {errors.products?.[index]?.product && (
                                                        <span className="text-sm text-red-500">
                                                            {errors.products[index]?.product?.message}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 w-full md:w-1/3">
                                                    <div className="flex justify-between">
                                                        <Label>Quantity</Label>
                                                        {selectedProductId && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Max: {availableQuantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={availableQuantity}
                                                        disabled={!selectedProductId || availableQuantity === 0}
                                                        {...register(`products.${index}.quantity`, {
                                                            valueAsNumber: true,
                                                            validate: {
                                                                notExceedAvailable: (value) =>
                                                                    !selectedProductId ||
                                                                    value <= availableQuantity ||
                                                                    `Cannot exceed available quantity (${availableQuantity})`,
                                                            }
                                                        })}
                                                    />
                                                    {errors.products?.[index]?.quantity && (
                                                        <span className="text-sm text-red-500">
                                                            {errors.products[index]?.quantity?.message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedProductId && availableQuantity === 0 && (
                                                <div className="text-sm text-amber-600 mt-1">
                                                    Warning: This product is out of stock
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Loading..." : project ? "Save Changes" : "Add Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent >
        </Dialog >
    );
};

export default ProjectFormModal;