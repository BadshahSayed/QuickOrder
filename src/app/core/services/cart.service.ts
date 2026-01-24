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

    addToCart(product: Product) {
        this.cartItems.update(items => {
            const existing = items.find(item => item.product.id === product.id);
            if (existing) {
                return items.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...items, { product, quantity: 1 }];
            }
        });
    }

    removeFromCart(productId: number) {
        this.cartItems.update(items => items.filter(item => item.product.id !== productId));
    }

    updateQuantity(productId: number, quantity: number) {
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        this.cartItems.update(items =>
            items.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    }

    clearCart() {
        this.cartItems.set([]);
    }
}
