import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, NgClass],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private router = inject(Router); // Inject Router

  products$ = this.productService.getProducts();

  showModal = false; // State for confirmation modal (after add to cart)
  showQuickView = false; // State for quick view modal

  selectedProduct: Product | null = null;
  selectedColor: any = null;
  selectedSize: string | null = null;
  currentImage: string = '';

  openProductDetails(product: Product) {
    this.selectedProduct = product;
    this.currentImage = product.image;
    this.selectedColor = null;
    this.selectedSize = null;

    // Pre-select first color/size if available? 
    // Requirement says "Provide color selection options", implying user chooses.
    // However, for better UX, we can default to the first option if desired.
    // Let's stick to user explicit selection for now, or just default image.
    if (product.colors && product.colors.length > 0) {
      this.selectedColor = product.colors[0];
      this.currentImage = this.selectedColor.image || product.image;
    }

    this.showQuickView = true;
  }

  closeProductDetails() {
    this.showQuickView = false;
    this.selectedProduct = null;
    this.selectedColor = null;
    this.selectedSize = null;
  }

  selectColor(color: any) {
    this.selectedColor = color;
    if (color.image) {
      this.currentImage = color.image;
    }
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  addToCartFromQuickView() {
    if (!this.selectedProduct) return;

    if (this.selectedProduct.colors && !this.selectedColor) {
      alert('Please select a color'); // Simple validation
      return;
    }

    if (this.selectedProduct.sizes && !this.selectedSize) {
      alert('Please select a size'); // Simple validation
      return;
    }

    this.cartService.addToCart(
      this.selectedProduct,
      this.selectedColor?.name,
      this.selectedSize || undefined
    );
    this.closeProductDetails();
    this.showModal = true; // Show confirmation modal
  }

  addToCart(product: Product) {
    // Direct add (if no variants logic needed, but now most have variants)
    this.cartService.addToCart(product);
    this.showModal = true;
  }

  proceedToCart() {
    this.router.navigate(['/cart']);
  }

  continueShopping() {
    this.showModal = false;
  }

  isHovered(id: number) {
    return false; // Handled by CSS
  }
}
