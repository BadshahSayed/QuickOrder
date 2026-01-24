import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../models/product.model';
import { CartService } from './cart.service';
import emailjs from '@emailjs/browser';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private router = inject(Router);
    private cartService = inject(CartService);

    private merchantId = '380786';
    private subMerchantId = '78';
    private encryptionKey = '3862351407801163';
    private payMode = '9';
    private returnUrl = 'https://www.bombaygymkhana.com';
    // private returnUrl = 'http://localhost:4200/order-success'; 

    // URL Toggle
    private isUat = false; // Set to true to test UAT if Prod is blocked
    private useMockPayment = false; // Set to true to simulate payment locally
    private contentUrlProd = 'https://eazypay.icicibank.com/EazyPG';
    private contentUrlUat = 'https://eazypayuat.icicibank.com/EazyPG';

    private get paymentBaseUrl() {
        return this.isUat ? this.contentUrlUat : this.contentUrlProd;
    }

    private emailJsPublicKey = 'YOUR_EMAILJS_PUBLIC_KEY';
    private emailJsServiceId = 'YOUR_SERVICE_ID';
    private emailJsTemplateId = 'YOUR_TEMPLATE_ID';

    constructor() { }

    createOrder(order: Order): Promise<boolean> {
        return new Promise((resolve) => {
            if (order.total === 0) {
                // Direct success only for free orders
                this.processSuccess(order);
                resolve(true);
            } else {
                this.initiatePayment(order);
                resolve(false);
            }
        });
    }

    // New: Handle the return from ICICI
    async verifyPayment(queryParams: any): Promise<Order | null> {
        console.log('Verifying payment with params:', queryParams);

        // 1. Retrieve the pending order
        const pendingOrderJson = sessionStorage.getItem('pending_order');
        if (!pendingOrderJson) {
            console.error('No pending order found in session storage.');
            return null;
        }

        const order: Order = JSON.parse(pendingOrderJson);
        const refNo = queryParams['Reference No'];

        // 2. Verify basic match 
        if (refNo && refNo !== order.id) {
            console.warn('Reference No mismatch', refNo, order.id);
        }

        // 3. Mark as Paid and finalize
        this.processSuccess(order);

        // 4. Clear pending order
        sessionStorage.removeItem('pending_order');

        return order;
    }

    private initiatePayment(order: Order) {
        console.log('Initiating ICICI Payment for Order:', order);

        // 1. Persist the order details before redirecting
        const referenceNo = order.id || Date.now().toString();
        order.id = referenceNo; // Ensure ID matches
        sessionStorage.setItem('pending_order', JSON.stringify(order));

        if (this.useMockPayment) {
            console.log('Mock Payment Enabled: Redirecting to success in 1 second...');
            setTimeout(() => {
                // Determine base return URL (strip any existing params just in case)
                const baseUrl = this.returnUrl.split('?')[0];
                // Construct Mock Callback URL
                const mockUrl = `${baseUrl}?status=SUCCESS&Reference%20No=${referenceNo}`;
                window.location.href = mockUrl;
            }, 1000);
            return;
        }

        const amount = order.total.toString();
        const mandatoryFields = this.getMandatoryFields(referenceNo, amount, order);

        // Encrypt Fields
        const encryptedMandatoryFields = this.encrypt(mandatoryFields);
        const encryptedReturnUrl = this.encrypt(this.returnUrl);
        const encryptedReferenceNo = this.encrypt(referenceNo);
        const encryptedSubMerchantId = this.encrypt(this.subMerchantId);
        const encryptedTransactionAmount = this.encrypt(amount);
        const encryptedPayMode = this.encrypt(this.payMode);

        // Construct Query Params (Note: URL Encoding is important usually, but we construct careful string)
        // User pattern: merchantid=380786&mandatory fields=...&optional fields=&returnurl=...

        const queryParams = [
            `merchantid=${this.merchantId}`,
            `mandatory%20fields=${encodeURIComponent(encryptedMandatoryFields)}`,
            `optional%20fields=`,
            `returnurl=${encodeURIComponent(encryptedReturnUrl)}`,
            `Reference%20No=${encodeURIComponent(encryptedReferenceNo)}`,
            `submerchantid=${encodeURIComponent(encryptedSubMerchantId)}`,
            `transaction%20amount=${encodeURIComponent(encryptedTransactionAmount)}`,
            `paymode=${encodeURIComponent(encryptedPayMode)}`
        ];

        const fullUrl = `${this.paymentBaseUrl}?${queryParams.join('&')}`;

        console.log('Redirecting to:', fullUrl);
        window.location.href = fullUrl;
    }

    private getMandatoryFields(referenceNo: string, amount: string, order: Order): string {
        // Pattern: 123456|78|10|abc|a1|abc@gmail.com|abc|abc|9999999999
        // Mapping: Ref|SubMerch|Amt|Name|a1|Email|Address|City?|Mobile

        // Fallbacks for missing fields to match pattern "abc"
        const name = order.customerName || 'abc';
        const email = 'abc@gmail.com'; // Hardcoded as per sample/defauilt since not captured
        const address = order.customerAddress || 'abc'; // Use address if avail, else abc
        const field8 = 'abc';

        return `${referenceNo}|${this.subMerchantId}|${amount}|${name}|a1|${email}|${address}|${field8}|${order.customerMobile}`;
    }

    private encrypt(text: string): string {
        const keyParsed = CryptoJS.enc.Utf8.parse(this.encryptionKey);
        const encrypted = CryptoJS.AES.encrypt(text, keyParsed, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }

    private processSuccess(order: Order) {
        order.status = 'PAID';
        this.cartService.clearCart();
        // Send Email
        this.sendEmailNotification(order);
        this.router.navigate(['/order-success'], { state: { order } });
    }

    private sendEmailNotification(order: Order) {
        // Note: In a real app, do this on the backend!
        // For this frontend-only demo, we use EmailJS directly.

        if (this.emailJsPublicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
            console.log('EmailJS keys not set. Skipping email.', order);
            return;
        }

        const templateParams = {
            to_name: order.customerName,
            order_id: order.id || 'N/A',
            amount: order.total,
            items_summary: order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')
        };

        emailjs.send(this.emailJsServiceId, this.emailJsTemplateId, templateParams, this.emailJsPublicKey)
            .then((response) => {
                console.log('Email sent!', response.status, response.text);
            }, (err) => {
                console.error('Email failed...', err);
            });
    }
}
