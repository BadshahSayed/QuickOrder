import { Product } from "../models/product.model";

export const PRODUCTS: Product[] = [
    {
        id: 1,
        // Old Name: Bombay Gymkhana Flask
        name: "Thermo-Steel Coffee Mug",
        description: "A classy, well-finished mug designed to keep up with your day, featuring Milton durability and all-day temperature retention.",
        price: 620,
        image: "/assets/products/flask-front.jpg",
        images: ["/assets/products/flask-front.jpg", "/assets/products/flask-back.jpg"]
    },
    {
        id: 2,
        // Merged Name: Classic Polo T-Shirt (White & Black)
        name: "Classic Polo T-Shirt",
        description: "The Polo T-Shirt - tailored fit, premium fabric, and a commemorative logo that celebrates the Club's heritage. Available in Classic White and Black.",
        price: 1150,
        image: "/assets/products/polo-white.jpg",
        images: ["/assets/products/polo-white.jpg", "/assets/products/polo-black.jpg", "/assets/products/catalog-1.jpg"],
        colors: [
            { name: 'White', class: 'bg-white border-gray-200', code: '#ffffff', image: '/assets/products/polo-white.jpg' },
            { name: 'Black', class: 'bg-black border-gray-900', code: '#000000', image: '/assets/products/polo-black.jpg' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '5XL']
    },
    {
        id: 4,
        // Merged Name: Zodiac Collection: Silk Tie (Yellow & Black)
        name: "Zodiac Collection: Silk Tie",
        description: "Skilfully woven in pure silk and finished with the exclusive 150 Years logo. A refined tribute to the Club's legacy.",
        price: 1665,
        image: "/assets/products/tie-beige.jpg", // Yellow/Beige as default
        images: ["/assets/products/tie-beige.jpg", "/assets/products/tie-blue.jpg", "/assets/products/catalog-2.jpg"],
        colors: [
            { name: 'Yellow', class: 'bg-yellow-200 border-yellow-300', code: '#fef3c7', image: '/assets/products/tie-beige.jpg' },
            { name: 'Black', class: 'bg-gray-900 border-black', code: '#111827', image: '/assets/products/tie-blue.jpg' }
        ]
    },
    {
        id: 6,
        // New Product
        name: "Polo Classic Umbrella",
        description: "A lightweight and durable black-and-white umbrella with the classic Polo design and 150-years logo. Wind-resistant, quick-dry and easy to hold.",
        price: 955,
        image: "/assets/products/umbrella-open.jpg",
        images: ["/assets/products/umbrella-open.jpg", "/assets/products/umbrella-front.jpg", "/assets/products/catalog-2.jpg"]
    },
    {
        id: 7,
        // New Product
        name: "Bombay Gymkhana Key Chain",
        description: "STYLISH BRASS KEY CHAIN A Sleek black-and-gold key chain embossed with Bombay Gymkhana's 150-Year logo.Stylish,durable, and perfect for everyday use or thoughtful gifting",
        price: 488,
        image: "/assets/products/KeyChain.jpg",
        images: ["/assets/products/KeyChain.jpg", "/assets/products/KeyChain.jpg"]
    },
    {
        id: 8,
        // New Product
        name: "Bombay Gymkhana Stamp",
        description: "150TH ANNIVERSARY OF BOMBAY GYMKHANA Stamp",
        price: 1,
        image: "/assets/products/BGM-Stamp.jpg",
        images: ["/assets/products/BGM-Stamp.jpg"]
    }
];
