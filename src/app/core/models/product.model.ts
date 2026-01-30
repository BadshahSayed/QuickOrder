export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    images?: string[];
    category?: string;
    colors?: { name: string; class: string; code: string; image?: string }[];
    sizes?: string[];
}

export interface CartItem {
    product: Product;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
}

export interface Order {
    id?: string;
    customerMemberId: string;
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
