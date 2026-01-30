import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    cartItems = signal<CartItem[]>([]);

    cartTotal = computed(() => this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0));
    cartCount = computed(() => this.cartItems().reduce((count, item) => count + item.quantity, 0));

    constructor() {
        this.loadCart();

        // Auto-save effect
        effect(() => {
            localStorage.setItem('cart', JSON.stringify(this.cartItems()));
        });
    }

    private loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cartItems.set(JSON.parse(savedCart));
        }
    }

    addToCart(product: Product, color?: string, size?: string, image?: string) {
        this.cartItems.update(items => {
            const existing = items.find(item =>
                item.product.id === product.id &&
                item.selectedColor === color &&
                item.selectedSize === size
            );

            if (existing) {
                return items.map(item =>
                    (item.product.id === product.id && item.selectedColor === color && item.selectedSize === size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...items, { product, quantity: 1, selectedColor: color, selectedSize: size, selectedImage: image }];
            }
        });
    }

    removeFromCart(productId: number, color?: string, size?: string) {
        this.cartItems.update(items => items.filter(item =>
            !(item.product.id === productId && item.selectedColor === color && item.selectedSize === size)
        ));
    }

    updateQuantity(productId: number, quantity: number, color?: string, size?: string) {
        if (quantity <= 0) {
            this.removeFromCart(productId, color, size);
            return;
        }

        this.cartItems.update(items =>
            items.map(item =>
                (item.product.id === productId && item.selectedColor === color && item.selectedSize === size)
                    ? { ...item, quantity }
                    : item
            )
        );
    }

    clearCart() {
        this.cartItems.set([]);
        localStorage.removeItem('cart'); // Force clear immediately
    }
}
