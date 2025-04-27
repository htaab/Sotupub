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
import { Product } from "@/types/product";
import { Textarea } from "@/components/ui/textarea";
import { productService } from "@/services/productservice";
import { useQueryClient } from "@tanstack/react-query";
import { getImageUrl } from "@/lib/utils";

const productFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    reference: z.string().min(1, "Reference is required"),
    description: z.string().optional(),
    category: z.string().min(2, "Category is required"),
    quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormModalProps {
    triggerMessage: ReactNode;
    product?: Product;
}

const ProductFormModal = ({ triggerMessage, product }: ProductFormModalProps) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | undefined>(
        product?.image ? getImageUrl(product.image) : undefined
    );
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: product
            ? {
                name: product.name,
                reference: product.reference,
                description: product.description,
                category: product.category,
                quantity: product.quantity,
                price: product.price,
            }
            : {
                quantity: 0,
                price: 0,
            },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(product?.image ? getImageUrl(product.image) : undefined);
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setIsSubmitting(true);
            const formData = new FormData();

            Object.entries(data).forEach(([key, value]) => {
                if (key === "image") {
                    if (value?.[0]) formData.append("image", value[0]);
                } else if (value !== undefined) {
                    formData.append(key, String(value));
                }
            });

            if (product) {
                // Update existing product
                await productService.updateProduct(product._id, formData);
                toast.success("Product updated successfully");
            } else {
                // Create new product
                await productService.createProduct(formData);
                toast.success("Product created successfully");
            }

            queryClient.invalidateQueries({ queryKey: ["products"] });
            setOpen(false);
            reset();
            setImagePreview(undefined);
        } catch (error) {
            // More specific error handling
            if (error instanceof Error) {
                // Display the specific error message from the server
                toast.error(error.message);
            } else {
                toast.error(`An unexpected error occurred while ${product ? 'updating' : 'creating'} the product`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (open) {
            // If dialog is open, reset form with current product data
            if (product) {
                reset({
                    name: product.name,
                    reference: product.reference,
                    description: product.description,
                    category: product.category,
                    quantity: product.quantity,
                    price: product.price,
                });
                setImagePreview(product.image ? getImageUrl(product.image) : undefined);
            } else {
                reset({
                    name: "",
                    reference: "",
                    description: "",
                    category: "",
                    quantity: 0,
                    price: 0,
                });
                setImagePreview(undefined);
            }
        }
    }, [open, product, reset]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerMessage}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{product ? `Edit Product` : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {product ? "Update product information" : "Add a new product to inventory"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-right">Product Name*</Label>
                            <Input {...register("name")} />
                            {errors.name && (
                                <span className="text-sm text-red-500">{errors.name.message?.toString()}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-right">Reference</Label>
                            <Input {...register("reference")} />
                            {errors.reference && (
                                <span className="text-sm text-red-500">
                                    {errors.reference.message?.toString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="text-right">Description</Label>
                        <Textarea {...register("description")} />
                        {errors.description && (
                            <span className="text-sm text-red-500">{errors.description.message?.toString()}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-right">Category*</Label>
                            <Input {...register("category")} />
                            {errors.category && (
                                <span className="text-sm text-red-500">{errors.category.message?.toString()}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-right">Quantity*</Label>
                            <Input type="number" min="0" {...register("quantity")} />
                            {errors.quantity && (
                                <span className="text-sm text-red-500">{errors.quantity.message?.toString()}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-right">Price*</Label>
                            <Input type="number" min="0" step="0.01" {...register("price")} />
                            {errors.price && (
                                <span className="text-sm text-red-500">{errors.price.message?.toString()}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Product Image</Label>
                        <Input
                            type="file"
                            {...register("image")}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {errors.image && (
                            <span className="text-sm text-red-500">
                                {errors.image.message?.toString()}
                            </span>
                        )}
                        {imagePreview && (
                            <div className="mt-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-md"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Loading..." : product ? "Save Changes" : "Add Product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProductFormModal;