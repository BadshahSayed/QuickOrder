import { Routes } from '@angular/router';
import { ProductListComponent } from './features/shop/product-list/product-list';
import { CartComponent } from './features/shop/cart/cart';
import { CheckoutComponent } from './features/checkout/checkout';
import { OrderSuccessComponent } from './features/shop/order-success/order-success';
import { OrderFailureComponent } from './features/shop/order-failure/order-failure';

export const routes: Routes = [
    { path: '', redirectTo: 'shop', pathMatch: 'full' },
    { path: 'shop', component: ProductListComponent },
    { path: 'shop/product/:id', loadComponent: () => import('./features/shop/product-details/product-details').then(m => m.ProductDetailsComponent) },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'order-success', component: OrderSuccessComponent },
    { path: 'order-failure', component: OrderFailureComponent },
    { path: '**', redirectTo: 'shop' }
];
