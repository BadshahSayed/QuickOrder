import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
    selector: 'app-product-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-details.html',
})
export class ProductDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductService);
    private cartService = inject(CartService);

    product = signal<Product | undefined>(undefined);
    selectedImage = signal<string>('');

    // For "added to cart" visual feedback
    isAddedToCart = signal<boolean>(false);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = Number(params.get('id'));
            if (id) {
                this.productService.getProductById(id).subscribe(product => {
                    this.product.set(product);
                    if (product) {
                        // Default to the first image or main image
                        this.selectedImage.set(product.images && product.images.length > 0 ? product.images[0] : product.image);
                    }
                });
            }
        });
    }

    selectImage(image: string) {
        this.selectedImage.set(image);
    }

    addToCart() {
        const p = this.product();
        if (p) {
            this.cartService.addToCart(p);
            this.isAddedToCart.set(true);
            setTimeout(() => this.isAddedToCart.set(false), 2000); // Reset after 2s
        }
    }
}
