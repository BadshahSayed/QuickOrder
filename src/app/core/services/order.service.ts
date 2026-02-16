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
    // Dynamic Return URL to support both Localhost and Production
    // Vercel:
    private get returnUrl() {
        return `${window.location.origin}/api/payment-callback`;
    }
    // Hostinger (Uncomment below and comment above when deploying to Hostinger):
    // private get returnUrl() {
    //    return `${window.location.origin}/payment-callback.php`;
    // }

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
                this.processSuccess(order); // It is async but we don't strictly wait for email to resolve the createOrder promise? 
                // Actually, if we want to wait for email before UI update:
                // await this.processSuccess(order); 
                // But this method is not async in the signature. 
                // Let's leave this one as is, it's for 'Free' orders which are instant.
                // Reverting complexity - no change needed here if we don't want to break interface.
                // But wait, processSuccess is now Async. Calling it without await is 'fire and forget'.
                // That's acceptable for the UI flow here.
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
            console.error('❌ Verification Failed: No pending order found in session storage.');
            return null;
        }

        const order: Order = JSON.parse(pendingOrderJson);

        // CRITICAL FIX: Ensure dates are actual Date objects after JSON parsing
        if (order.createdAt && typeof order.createdAt === 'string') {
            order.createdAt = new Date(order.createdAt);
        }

        // Use robust parameter lookup for bank fields
        const refNo = this.getParam(queryParams, 'Reference No', 'ReferenceNo');
        const responseCode = this.getParam(queryParams, 'Response Code', 'ResponseCode');
        const bankRef = this.getParam(queryParams, 'Unique Ref Number', 'UniqueRefNumber');
        const bankAmount = this.getParam(queryParams, 'Total Amount', 'TotalAmount', 'Transaction Amount', 'TransactionAmount');

        console.log('🔍 Extracted bank fields:', { refNo, responseCode, bankRef, bankAmount });

        // 2. Verify basic match 
        if (refNo && refNo !== order.id) {
            console.warn('Reference No mismatch', refNo, order.id);
        }

        // 3. Mark as Paid and finalize if success
        // E000 is ICICI success code
        if (responseCode === 'E000' || queryParams['status'] === 'SUCCESS') {
            console.log('✅ Success detected! Updating status to PAID...');
            order.status = 'PAID';
            order.paymentId = bankRef || queryParams['Unique Ref Number'];

            // Process success (clear cart, send email) immediately
            await this.processSuccess(order);
        } else {
            console.warn('⚠️ Payment not successful based on codes:', responseCode);
        }

        // 4. Clear pending order from session
        sessionStorage.removeItem('pending_order');

        return order;
    }

    private getParam(params: any, ...keys: string[]): string | undefined {
        // First try exact matches
        for (const key of keys) {
            if (params[key]) return params[key];
        }

        // Fallback to normalized matching (insensitive to spaces, underscores, capitalization)
        const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[\s_%]/g, ''));
        for (const key in params) {
            const normalizedKey = key.toLowerCase().replace(/[\s_%]/g, '');
            if (normalizedKeys.includes(normalizedKey)) {
                return params[key];
            }
        }
        return undefined;
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

    private async processSuccess(order: Order) {
        console.log('🎯 Processing successful order:', order.id);

        // Immediate Cart Clear - Do this first to ensure consistency
        this.cartService.clearCart();
        console.log('🛒 Cart cleared successfully');

        order.status = 'PAID';

        // Trigger Email Notification (non-blocking but logged)
        console.log('📧 Triggering email notification...');
        this.sendEmailNotification(order).catch(err => {
            console.error('📧 Email notification failed silently:', err);
        });

        // Navigation safety
        if (!this.router.url.includes('/order-success')) {
            console.log('🔄 Navigating to order success page');
            this.router.navigate(['/order-success'], { state: { order } });
        }
    }

    private async sendEmailNotification(order: Order) {
        // Using Web3Forms - Free service, no signup required
        // Get your free access key from: https://web3forms.com/
        const adminEmail = 'agm.relations@bombaygymkhana.com';
        const web3formsAccessKey = '8d165190-1f6d-424f-b88d-adf3352256ce';

        try {
            console.log('📧 Sending order notification email to admin...');

            // Switch to FormData as per standard Web3Forms usage which is more reliable
            const formData = new FormData();
            formData.append('access_key', web3formsAccessKey);
            formData.append('subject', `🛍️ New Order #${order.id} - ${order.customerName}`);
            formData.append('from_name', 'MyGymkhanaStore - Bombay Gymkhana');
            formData.append('to', adminEmail);
            formData.append('message', this.formatOrderEmail(order));

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                // No Content-Type header needed for FormData
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Email notification sent successfully to admin!');
            } else {
                console.error('❌ Email sending failed. API Response:', result);

                // Alert for specific issues
                if (result.message && result.message.toLowerCase().includes('verify')) {
                    const msg = `🔴 ATTENTION: The email address ${adminEmail} needs verification. Please check your inbox (and spam) for a verification link from Web3Forms and click it to activate the key.`;
                    console.error(msg);
                    // alert(msg); // Optional: alert might be too intrusive during a silent process, keep as log for now.
                } else if (result.message && result.message.includes('rate limit')) {
                    console.warn('⚠️ Email Rate Limit Hit.');
                }
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
