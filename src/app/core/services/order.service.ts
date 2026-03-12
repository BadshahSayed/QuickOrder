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
            console.log('ℹ️ Verification skipped: No pending order in session (likely already processed).');
            return null;
        }

        // IMPORTANT: Remove immediately to prevent race conditions/double calls
        sessionStorage.removeItem('pending_order');

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

            // Process success (clear cart, send email, log order) immediately
            await this.processSuccess(order);
        } else {
            console.warn('⚠️ Payment not successful based on codes:', responseCode);
        }

        console.log('🏁 verifyPayment returning order with status:', order.status);
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
        const email = 'abc@gmail.com';
        const address = 'Club House Pickup';
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

        // 1. Update status immediately 
        order.status = 'PAID';

        // 2. Clear cart
        this.cartService.clearCart();
        console.log('🛒 Cart cleared successfully');

        // 3. Email Notification will be triggered by the component after URL cleaning
        console.log('📧 Email notification will be triggered by component');

        // 4. Log the order locally for admin audit
        this.logOrder(order);


        // Navigation safety
        if (!this.router.url.includes('/order-success')) {
            console.log('🔄 Navigating to order success page');
            this.router.navigate(['/order-success'], { state: { order } });
        }
    }

    async sendEmailNotification(order: Order) {
        // Using Web3Forms - Free service, no signup required
        // Get your free access key from: https://web3forms.com/
        const adminEmail = 'agm.relations@bombaygymkhana.com';
        const web3formsAccessKey = '8d165190-1f6d-424f-b88d-adf3352256ce';

        try {
            console.log('📧 Sending order notification email...');

            const formData = new FormData();
            formData.append('access_key', web3formsAccessKey);
            formData.append('subject', `NEW ORDER ${order.id} for ${order.customerName}`);
            formData.append('from_name', 'MyGymkhanaStore');
            formData.append('to', adminEmail); // Restored as it worked for QR
            formData.append('message', this.formatOrderEmail(order));

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Email notification sent successfully!');
            } else {
                console.error('❌ Email sending failed:', result);
            }
        } catch (error) {
            console.error('❌ Error sending email:', error);
        }
    }




    private formatOrderEmail(order: Order): string {
        const itemsList = order.items.map(item =>
            `- ${item.product.name} (Qty: ${item.quantity}) - Rs.${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n');

        return `
NEW ORDER RECEIVED
------------------
Order ID: ${order.id}
Status: ${order.status}
Customer: ${order.customerName}
Member ID: ${order.customerMemberId || 'N/A'}
Type: Gymkhana Member
Mobile: ${order.customerMobile}

DELIVERY:
---------
Method: Club House Pickup
(Pickup at Club House)

PRODUCTS ordered:
-----------------
${itemsList}

ORDER SUMMARY:
--------------
Total Amount: Rs.${order.total.toFixed(2)}

Action: Prepare for pickup

Sent from MyGymkhanaStore        `.trim();
    }

    private async logOrder(order: Order) {
        try {
            const logEntry = {
                id: order.id,
                customerName: order.customerName,
                customerMemberId: order.customerMemberId || 'N/A',
                customerMobile: order.customerMobile,
                total: order.total,
                paymentId: order.paymentId || 'N/A',
                status: order.status,
                timestamp: new Date().toISOString()
            };

            console.log('📝 Sending global log for audit:', logEntry.id);

            const response = await fetch('/api/save-order-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) throw new Error('Failed to save global log');
            console.log('✅ Global log saved successfully.');
        } catch (error) {
            console.error('❌ Error saving global log:', error);
        }
    }

    async getLogs(): Promise<any[]> {
        try {
            const response = await fetch('/api/get-order-logs');
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching global logs:', error);
            return [];
        }
    }

    async clearLogs() {
        try {
            await fetch('/api/clear-order-logs', { method: 'POST' });
            console.log('🗑️ Global logs cleared.');
        } catch (error) {
            console.error('❌ Error clearing global logs:', error);
        }
    }

}
