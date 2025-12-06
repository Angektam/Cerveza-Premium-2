import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-special-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-special-features.component.html',
  styleUrl: './dashboard-special-features.component.css'
})
export class DashboardSpecialFeaturesComponent {
  @Input() currentUser: any;

  @Output() showPromotionsClick = new EventEmitter<void>();
  @Output() showRecommendationsClick = new EventEmitter<void>();
  @Output() showAdminPanelClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  get showAdminButton(): boolean {
    return this.currentUser?.rol === 'admin' || this.currentUser?.rol === 'vendedor';
  }

  onShowPromotions() {
    this.showPromotionsClick.emit();
  }

  onShowRecommendations() {
    this.showRecommendationsClick.emit();
  }

  onShowAdminPanel() {
    this.showAdminPanelClick.emit();
  }

  onLogout() {
    this.logoutClick.emit();
  }
}
