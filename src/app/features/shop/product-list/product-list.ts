import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private router = inject(Router); // Inject Router

  products$ = this.productService.getProducts();

  showModal = false; // State for modal

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    this.showModal = true; // Show custom modal
  }

  proceedToCart() {
    this.router.navigate(['/cart']);
  }

  continueShopping() {
    this.showModal = false;
  }

  isHovered(id: number) {
    return false; // Handled by CSS group-hover, keeping method if needed for other logic
  }
}
