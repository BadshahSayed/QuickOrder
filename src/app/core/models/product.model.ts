export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    images?: string[];
    category?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Order {
    id?: string;
    customerName: string;
    customerMobile: string;
    customerAddress?: string; // Optional if pickup
    deliveryMode: 'PICKUP' | 'DELIVERY';
    deliveryCharge: number;
    items: CartItem[];
    subtotal: number;
    total: number;
    paymentId?: string;
    status: 'PENDING' | 'PAID' | 'FAILED';
    createdAt: Date;
}
