import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

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
  private cdr = inject(ChangeDetectorRef);



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
    // We only return early if we have the order AND there are no callback parameters to process.
    // Otherwise, we must proceed to check queryParams for the bank's response.
    const queryMap = this.route.snapshot.queryParamMap;
    const hasCallbackParams = queryMap.has('Reference No') ||
      queryMap.has('ReferenceNo') ||
      queryMap.has('Response Code') ||
      queryMap.has('ResponseCode') ||
      queryMap.has('status');

    if (this.order && !hasCallbackParams) {
      console.log('✅ Order exists and no callback detected. Skipping verification.');
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
            console.log('✅ Payment verified. New Order Status:', this.order.status);
            // Immediate Cart Clear - Safety double-clear
            this.cartService.clearCart();

            // Small delay to ensure Angular is ready for update
            setTimeout(() => {
              this.cdr.detectChanges();
              console.log('✅ UI update triggered');
            }, 100);


          } else {
            console.warn('⚠️ Payment verification returned NO order.');
            this.error = 'Payment verification failed or order not found.';
          }
        } catch (err) {
          console.error('❌ Error during verification:', err);
          this.error = 'An error occurred during verification.';
        }
      } else {
        // If no params, but we already have an order (from constructor), just ensure cart is clear
        if (this.order && this.order.status === 'PAID') {
          this.cartService.clearCart();
        }
      }
      this.loading = false;
    });

    // If still no order and no params after a short delay (or immediately if sync), handle empty state
    // For now, loading=false handles the display
  }
}
