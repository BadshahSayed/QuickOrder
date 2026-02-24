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

  deliveryFee = 0;

  // State for Membership Logic
  showMemberPopup = false;
  isMember = true;

  checkoutForm = this.fb.group({
    memberid: ['', Validators.required],
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
    deliveryMode: ['PICKUP', Validators.required]
  });

  // Derived state for total
  total = computed(() => {
    return this.subtotal();
  });

  constructor() { }

  get deliveryMode() {
    return this.checkoutForm.get('deliveryMode')?.value;
  }

  async onSubmit() {
    if (this.checkoutForm.invalid) return;

    const formVal = this.checkoutForm.value;
    const deliveryCharge = 0;

    const order: Order = {
      userType: 'MEMBER',
      customerMemberId: formVal.memberid || undefined,
      customerName: formVal.name!,
      customerMobile: formVal.mobile!,
      customerAddress: undefined,
      deliveryMode: 'PICKUP',
      deliveryCharge: deliveryCharge,
      items: this.cartItems(),
      subtotal: this.subtotal(),
      total: this.subtotal(),
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
