import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { OrderService } from './core/services/order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  route = inject(ActivatedRoute);

  cartCount = this.cartService.cartCount;

  ngOnInit() {
    // Global listener for payment return on the root (in case returnUrl hits /)
    this.route.queryParams.subscribe(async params => {
      // Check for ICICI specific params or generic status
      if (params['Reference No'] || params['status']) {
        console.log('App Root: Payment Callback Detected', params);
        try {
          // Verify and finalize (will navigate to success page)
          await this.orderService.verifyPayment(params);
        } catch (e) {
          console.error('App Root: Payment verification error', e);
        }
      }
    });
  }
}
