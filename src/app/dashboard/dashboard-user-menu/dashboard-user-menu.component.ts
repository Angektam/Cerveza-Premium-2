import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-user-menu.component.html',
  styleUrl: './dashboard-user-menu.component.css'
})
export class DashboardUserMenuComponent {
  @Input() favoritesCount: number = 0;

  @Output() showProfileClick = new EventEmitter<void>();
  @Output() showFavoritesClick = new EventEmitter<void>();
  @Output() showPointsHistoryClick = new EventEmitter<void>();
  @Output() showAddressesClick = new EventEmitter<void>();

  onShowProfile() {
    this.showProfileClick.emit();
  }

  onShowFavorites() {
    this.showFavoritesClick.emit();
  }

  onShowPointsHistory() {
    this.showPointsHistoryClick.emit();
  }

  onShowAddresses() {
    this.showAddressesClick.emit();
  }
}
