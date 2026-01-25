import { Component, inject, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/product.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.cartTotal;

  deliveryFee = 50;

  // Signal to track delivery mode for reactive total calculation
  deliveryModeSignal = signal<'PICKUP' | 'DELIVERY'>('PICKUP');

  checkoutForm = this.fb.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]], // Allow 10-12 digits
    deliveryMode: ['PICKUP', Validators.required],
    address: ['']
  });

  // Derived state for total - now reactive with signal
  total = computed(() => {
    const mode = this.deliveryModeSignal();
    const delivery = mode === 'DELIVERY' ? this.deliveryFee : 0;
    return this.subtotal() + delivery;
  });

  constructor() {
    // React to delivery mode changes to update validators or state if needed
    this.checkoutForm.get('deliveryMode')?.valueChanges.subscribe(mode => {
      // Update the signal to make total reactive
      this.deliveryModeSignal.set(mode as 'PICKUP' | 'DELIVERY');

      const addressControl = this.checkoutForm.get('address');
      if (mode === 'DELIVERY') {
        addressControl?.setValidators([Validators.required]);
      } else {
        addressControl?.clearValidators();
      }
      addressControl?.updateValueAndValidity();
    });
  }

  get deliveryMode() {
    return this.checkoutForm.get('deliveryMode')?.value;
  }

  async onSubmit() {
    if (this.checkoutForm.invalid) return;

    const formVal = this.checkoutForm.value;
    const isDelivery = formVal.deliveryMode === 'DELIVERY';
    const deliveryCharge = isDelivery ? this.deliveryFee : 0;

    const order: Order = {
      customerName: formVal.name!,
      customerMobile: formVal.mobile!,
      customerAddress: formVal.address || undefined,
      deliveryMode: formVal.deliveryMode as 'PICKUP' | 'DELIVERY',
      deliveryCharge: deliveryCharge,
      items: this.cartItems(),
      subtotal: this.subtotal(),
      total: this.subtotal() + deliveryCharge,
      status: 'PENDING',
      createdAt: new Date()
    };

    const success = await this.orderService.createOrder(order);
    if (success) {
      // OrderService handles navigation to success page
      console.log('Order flow completed');
    }
  }
}
