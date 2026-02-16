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
  private emailSent = false;

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
      console.log('✅ Order exists and no callback detected.');
      this.loading = false;

      // TRIGGER EMAIL HERE - When URL is clean
      if (this.order.status === 'PAID' && !this.emailSent) {
        this.emailSent = true;
        console.log('📧 Clean state detected. Triggering email...');
        this.orderService.sendEmailNotification(this.order);
      }
      return;
    }

    // Otherwise, check for query params from Payment Gateway
    this.route.queryParams.subscribe(async params => {
      this.currentParams = params;
      if (params['Reference No'] || params['ReferenceNo'] || params['status'] || params['Response Code']) {
        console.log('Payment Callback Detected. Cleaning URL...');
        this.loading = true; // Ensure we show loading while verifying
        try {
          const verifiedOrder = await this.orderService.verifyPayment(params);
          if (verifiedOrder) {
            this.order = verifiedOrder;
            console.log('✅ Payment verified. Status:', this.order.status);

            // Immediate Cart Clear
            this.cartService.clearCart();

            // CLEAN URL: Redirect to self with NO params to avoid network reset issues
            this.router.navigate(['/order-success'], {
              queryParams: {},
              replaceUrl: true
            });

          } else {
            console.warn('⚠️ Payment verification returned NO order.');
            this.error = 'Payment verification failed or order not found.';
          }
        } catch (err) {
          console.error('❌ Error during verification:', err);
          this.error = 'An error occurred during verification.';
        }
      } else {
        // If no params, but we already have an order
        if (this.order && this.order.status === 'PAID') {
          this.cartService.clearCart();
        }
      }
      this.loading = false;
    });
  }

}
