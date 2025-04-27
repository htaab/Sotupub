export interface Product {
    _id: string;
    name: string;
    reference: string;
    description: string;
    category: string;
    quantity: number;
    price: number;
    image?: string;
    createdAt: string;
    updatedAt: string;
}