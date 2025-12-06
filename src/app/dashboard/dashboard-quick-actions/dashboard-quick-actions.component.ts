import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-quick-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-quick-actions.component.html',
  styleUrl: './dashboard-quick-actions.component.css'
})
export class DashboardQuickActionsComponent {
  @Input() cartCount: number = 0;

  @Output() orderDeliveryClick = new EventEmitter<void>();
  @Output() showCatalogClick = new EventEmitter<void>();
  @Output() showCartClick = new EventEmitter<void>();
  @Output() showOrdersClick = new EventEmitter<void>();

  onOrderDelivery() {
    this.orderDeliveryClick.emit();
  }

  onShowCatalog() {
    this.showCatalogClick.emit();
  }

  onShowCart() {
    this.showCartClick.emit();
  }

  onShowOrders() {
    this.showOrdersClick.emit();
  }
}
