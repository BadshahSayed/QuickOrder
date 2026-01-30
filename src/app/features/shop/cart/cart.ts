import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent {
  cartService = inject(CartService);

  cartItems = this.cartService.cartItems;
  cartTotal = this.cartService.cartTotal;

  increaseQty(productId: number, currentQty: number, color?: string, size?: string) {
    this.cartService.updateQuantity(productId, currentQty + 1, color, size);
  }

  decreaseQty(productId: number, currentQty: number, color?: string, size?: string) {
    this.cartService.updateQuantity(productId, currentQty - 1, color, size);
  }

  removeItem(productId: number, color?: string, size?: string) {
    this.cartService.removeFromCart(productId, color, size);
  }
}
