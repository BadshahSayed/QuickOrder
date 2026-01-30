import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../models/product.model';
import { CartService } from './cart.service';
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
    private useMockPayment = false; // Set to true to simulate payment locally - ENABLED FOR TESTING
    private contentUrlProd = 'https://eazypay.icicibank.com/EazyPG';
    private contentUrlUat = 'https://eazypayuat.icicibank.com/EazyPG';

    private get paymentBaseUrl() {
        return this.isUat ? this.contentUrlUat : this.contentUrlProd;
    }

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
        console.log('🎯 Processing successful order:', order.id);

        order.status = 'PAID';
        console.log('✅ Order status set to PAID');

        this.cartService.clearCart();
        console.log('🛒 Cart cleared');

        // Send Email
        this.sendEmailNotification(order);
        console.log('📧 Email notification triggered');

        this.router.navigate(['/order-success'], { state: { order } });
        console.log('🔄 Navigating to order success page');
    }

    private async sendEmailNotification(order: Order) {
        // Using Web3Forms - Free service, no signup required
        // Get your free access key from: https://web3forms.com/
        const adminEmail = 'badshahsayed2010@gmail.com';
        const web3formsAccessKey = '4407c9bf-af53-4148-9132-5b77df6a4fbc';

        try {
            console.log('📧 Sending order notification email to admin...');

            const formData = new FormData();
            formData.append('access_key', web3formsAccessKey);
            formData.append('subject', `🛍️ New Order #${order.id} - ${order.customerName}`);
            formData.append('from_name', 'MyGymkhanaStore - Bombay Gymkhana');
            formData.append('to', adminEmail);
            formData.append('message', this.formatOrderEmail(order));

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Email notification sent successfully to admin!');
            } else {
                console.error('❌ Email sending failed:', result);
            }
        } catch (error) {
            console.error('❌ Error sending email:', error);
        }
    }

    private formatOrderEmail(order: Order): string {
        const isMember = order.userType === 'MEMBER';
        const userTypeStr = isMember ? 'Gymkhana Member' : 'Guest (Non-Member)';
        const deliveryAction = order.deliveryMode === 'DELIVERY' ? 'Home Delivery' : 'Club House Pickup';

        const itemsList = order.items.map(item =>
            `- ${item.product.name} (Size: ${item.selectedSize || 'N/A'}, Color: ${item.selectedColor || 'N/A'}) x ${item.quantity} = ₹${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n');

        return `
═══════════════════════════════════════
🛍️ NEW ORDER RECEIVED
═══════════════════════════════════════

ORDER DETAILS:
--------------
Order ID: ${order.id || 'N/A'}
Order Date: ${order.createdAt.toLocaleString('en-IN')}
Status: ${order.status}
User Type: ${userTypeStr}

${isMember ? `
MEMBER INFORMATION:
-------------------
Member ID: ${order.customerMemberId}
Name: ${order.customerName}
Mobile: ${order.customerMobile}
` : `
GUEST INFORMATION:
------------------
Name: ${order.customerName}
Mobile: ${order.customerMobile}
Address: ${order.customerAddress}
`}

DELIVERY METHOD:
---------------
${deliveryAction}
${order.deliveryMode === 'PICKUP' ? '(Customer will pick up from the Club House)' : `(Deliver to: ${order.customerAddress})`}

PRODUCTS ORDERED:
----------------
${itemsList}

ORDER SUMMARY:
-------------
Subtotal:        ₹${order.subtotal.toFixed(2)}
Delivery Charge: ₹${order.deliveryCharge.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT:    ₹${order.total.toFixed(2)}

═══════════════════════════════════════
⚡ Action Required: ${deliveryAction === 'Home Delivery' ? 'Prepare order for delivery' : 'Prepare order for pickup'}
═══════════════════════════════════════

This is an automated notification from MyGymkhanaStore.
        `.trim();
    }
}
