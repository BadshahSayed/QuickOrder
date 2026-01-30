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

  // State for Membership Logic
  showMemberPopup = true;
  isMember: boolean | null = null;

  checkoutForm = this.fb.group({
    memberid: [''], // Validators added dynamically
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
    deliveryMode: ['PICKUP', Validators.required],
    address: [''] // Validators added dynamically
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
    });
  }

  setMemberStatus(isMember: boolean) {
    this.isMember = isMember;
    this.showMemberPopup = false;

    const memberIdControl = this.checkoutForm.get('memberid');
    const addressControl = this.checkoutForm.get('address');
    const deliveryModeControl = this.checkoutForm.get('deliveryMode');

    if (isMember) {
      // Member Logic: ID Required, Pickup Only
      memberIdControl?.setValidators([Validators.required]);
      addressControl?.clearValidators();

      // Force Pickup
      deliveryModeControl?.setValue('PICKUP');
      // We might want to disable the control in UI, but reactive forms handling...

    } else {
      // Non-Member Logic: Address Required, Delivery Only (as per explicit requirement "Hide Pickup")
      memberIdControl?.clearValidators();
      addressControl?.setValidators([Validators.required]);

      // Force Delivery
      deliveryModeControl?.setValue('DELIVERY');
    }

    memberIdControl?.updateValueAndValidity();
    addressControl?.updateValueAndValidity();
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
      userType: this.isMember ? 'MEMBER' : 'GUEST',
      customerMemberId: formVal.memberid || undefined,
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
