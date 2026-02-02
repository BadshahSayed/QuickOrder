import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, CommonModule],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css'
})
export class OrderSuccessComponent implements OnInit {
  order: any;
  now = new Date();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);

  loading = true;
  error = '';
  currentParams: any = {};

  constructor() {
    // Try to get from navigation state first (Direct mock testing)
    const navigation = this.router.getCurrentNavigation();
    this.order = navigation?.extras.state?.['order'];

    // Fallback: Check session storage for a pending order if navigation state is missing
    if (!this.order) {
      const pendingOrderJson = sessionStorage.getItem('pending_order');
      if (pendingOrderJson) {
        try {
          this.order = JSON.parse(pendingOrderJson);
          console.log('📦 Found order in session storage');
        } catch (e) {
          console.error('Error parsing pending order', e);
        }
      }
    }
  }

  ngOnInit(): void {
    // If we already have the order (from state), just show it
    if (this.order) {
      this.loading = false;
      return;
    }

    // Otherwise, check for query params from Payment Gateway
    this.route.queryParams.subscribe(async params => {
      this.currentParams = params;
      if (params['Reference No'] || params['ReferenceNo'] || params['status'] || params['Response Code']) {
        console.log('Payment Callback Detected:', params);
        this.loading = true; // Ensure we show loading while verifying
        try {
          const verifiedOrder = await this.orderService.verifyPayment(params);
          if (verifiedOrder) {
            this.order = verifiedOrder;
            this.cartService.clearCart(); // Safety double-clear
          } else {
            this.error = 'Payment verification failed or order not found.';
          }
        } catch (err) {
          console.error(err);
          this.error = 'An error occurred during verification.';
        }
      } else {
        // If no params, but we already have an order (from constructor), just ensure cart is clear
        if (this.order) {
          this.cartService.clearCart();
        }
      }
      this.loading = false;
    });

    // If still no order and no params after a short delay (or immediately if sync), handle empty state
    // For now, loading=false handles the display
  }
}
