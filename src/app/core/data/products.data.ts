import { Product } from "../models/product.model";

export const PRODUCTS: Product[] = [
    {
        id: 1,
        // Old Name: Bombay Gymkhana Flask
        name: "BG Thermo-Steel Coffee Mug",
        description: "A classy, well-finished mug designed to keep up with your day, featuring Milton durability and all-day temperature retention",
        price: 620,
        image: "/assets/products/flask-front.jpg",
        images: ["/assets/products/flask-front.jpg", "/assets/products/flask-back.jpg"]
    },
    {
        id: 2,
        // Merged Name: Classic Polo T-Shirt (White & Black)
        name: "Classic Men’s Polo T-Shirt",
        description: "The Casablanca Polo—tailored fit, premium fabric, and a commemorative logo that celebrates the Club’s heritage. Available in Classic White and Black.",
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
        id: 3,
        // Merged Name: Zodiac Collection: Silk Tie (Yellow & Black)
        name: "Zodiac Collection: Silk Tie",
        description: "Skilfully woven in pure silk and finished with the exclusive 150 Years logo. A refined tribute to the Club’s legacy",
        price: 1665,
        image: "/assets/products/tie-beige.jpg", // Yellow/Beige as default
        images: ["/assets/products/tie-beige.jpg", "/assets/products/tie-blue.jpg", "/assets/products/catalog-2.jpg"],
        colors: [
            { name: 'Yellow', class: 'bg-yellow-200 border-yellow-300', code: '#fef3c7', image: '/assets/products/tie-beige.jpg' },
            { name: 'Black', class: 'bg-gray-900 border-black', code: '#111827', image: '/assets/products/tie-blue.jpg' }
        ]
    },
    {
        id: 4,
        // New Product
        name: "Polo Classic Umbrella",
        description: "A lightweight and durable black-and-white umbrella with the classic Polo design and 150-years logo. Wind-resistant, quick-dry and easy to hold.",
        price: 955,
        image: "/assets/products/umbrella-open.jpg",
        images: ["/assets/products/umbrella-open.jpg", "/assets/products/umbrella-front.jpg", "/assets/products/catalog-2.jpg"]
    },
    {
        id: 5,
        // New Product
        name: "Ladies Umbrella",
        description: "A slightly smaller, lightweight, and durable umbrella with quick-dry fabric and a comfortable grip, ideal for everyday rain or sun protection",
        price: 825,
        image: "/assets/products/umbrella-open.jpg",
        images: ["/assets/products/umbrella-open.jpg", "/assets/products/umbrella-front.jpg", "/assets/products/catalog-2.jpg"]
    },
    {
        id: 6,
        // New Product
        name: "Stylish Metal Key chain",
        description: "A sleek black-and-gold key chain with Bombay Gymkhana’s 150-years logo on one side and the original logo on the other. Stylish, durable, and perfect for everyday use or gifting",
        price: 488,
        image: "/assets/products/KeyChain.jpg",
        images: ["/assets/products/KeyChain.jpg", "/assets/products/KeyChain.jpg"]
    },
    {
        id: 7,
        // New Product
        name: "White Sports Cap",
        description: "White Sports Cap with Bombay Gymkhana’s 150-years logo on one side and the original logo on the other. Stylish, durable, and perfect for everyday use or gifting",
        price: 211,
        image: "/assets/products/Cap.jpeg",
        images: ["/assets/products/Cap.jpeg", "/assets/products/Cap-2.jpeg"]
    },
    {
        id: 8,
        // New Product
        name: "Bombay Gymkhana stamp",
        description: "150TH ANNIVERSARY OF BOMBAY GYMKHANA Stamp",
        price: 5,
        image: "/assets/products/BGM-Stamp.jpg",
        images: ["/assets/products/BGM-Stamp.jpg"]
    },


    {
        id: 9,
        // New Product
        name: "First Day Covers with Stamp",
        description: "150TH ANNIVERSARY OF BOMBAY GYMKHANA",
        price: 26,
        image: "/assets/products/Firstday-Cover.jpg",
        images: ["/assets/products/Firstday-Cover.jpg", "/assets/products/Firstday-Cover.jpg", "/assets/products/catalog-2.jpg"]
    },
    {
        id: 10,
        // New Product
        name: "COMMORATIVE POSTAGE STAMP & FDC COMBO PACK",
        description: "COMMORATIVE POSTAGE STAMP & FDC COMBO PACK",
        price: 82,
        image: "/assets/products/CPS.jpeg",
        images: ["/assets/products/CPS.jpeg"]
    },

    {
        id: 11,
        // New Product
        name: "Brochure",
        description: "Brochure - 150TH ANNIVERSARY OF BOMBAY GYMKHANA",
        price: 15,
        image: "/assets/products/Brouchure-1.jpg",
        images: ["/assets/products/Brouchure-1.jpg", "/assets/products/Brouchure-2.jpg", "/assets/products/catalog-2.jpg"]
    },
    {
        id: 12,
        name: "Test Product",
        description: "Test Product for Payment Verification",
        price: 1,
        image: "/assets/products/Brouchure-1.jpg",
        images: ["/assets/products/Brouchure-1.jpg", "/assets/products/Brouchure-2.jpg", "/assets/products/catalog-2.jpg"]
    }
];


