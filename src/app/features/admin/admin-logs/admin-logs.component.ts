import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-logs',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './admin-logs.component.html',
    styleUrl: './admin-logs.component.css'
})
export class AdminLogsComponent implements OnInit {
    private orderService = inject(OrderService);

    logs: any[] = [];
    isAuthenticated = false;
    password = '';
    errorMessage = '';

    // Simple hardcoded password for now as requested
    private readonly ADMIN_PASSWORD = 'admin123';

    ngOnInit() {
        this.refreshLogs();
    }

    login() {
        if (this.password === this.ADMIN_PASSWORD) {
            this.isAuthenticated = true;
            this.errorMessage = '';
        } else {
            this.errorMessage = 'Invalid password. Please try again.';
        }
    }

    async refreshLogs() {
        this.logs = await this.orderService.getLogs();
    }

    async clearAllLogs() {
        if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
            await this.orderService.clearLogs();
            await this.refreshLogs();
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString();
    }
}
