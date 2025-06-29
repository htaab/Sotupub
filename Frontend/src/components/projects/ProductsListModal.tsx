import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Project } from "@/types/project";

const ProductsListModal = ({ project }: { project: Project }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md cursor-pointer">
                    <span className="font-medium">Products:</span> {project.products.length}
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>List of products</DialogTitle>
                    <DialogDescription>
                        {project.products.length} products in total
                    </DialogDescription>
                </DialogHeader>
                <ul className="text-sm space-y-1">
                    {project.products.slice(0, 3).map((item: Project["products"][0], index: number) => (
                        <li key={index} className="flex justify-between">
                            <span>{typeof item.product === 'string'
                                ? item.product
                                : item.product?.name}</span>
                            <span className="font-medium">Qty: {item.quantity}</span>
                        </li>
                    ))}
                    {project.products.length > 3 && (
                        <li className="text-muted-foreground text-xs">
                            +{project.products.length - 3} more products
                        </li>
                    )}
                </ul>
            </DialogContent>
        </Dialog>

    );
}

export default ProductsListModal;