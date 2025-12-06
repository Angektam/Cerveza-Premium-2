import { Component, OnInit, Output, EventEmitter, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardQuickActionsComponent } from '../dashboard/dashboard-quick-actions/dashboard-quick-actions.component';
import { DashboardUserMenuComponent } from '../dashboard/dashboard-user-menu/dashboard-user-menu.component';
import { DashboardUtilitiesComponent } from '../dashboard/dashboard-utilities/dashboard-utilities.component';
import { DashboardSpecialFeaturesComponent } from '../dashboard/dashboard-special-features/dashboard-special-features.component';

@Component({
  selector: 'app-dashboard-menu',
  standalone: true,
  imports: [
    CommonModule,
    DashboardQuickActionsComponent,
    DashboardUserMenuComponent,
    DashboardUtilitiesComponent,
    DashboardSpecialFeaturesComponent
  ],
  templateUrl: './dashboard-menu.component.html',
  styleUrl: './dashboard-menu.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DashboardMenuComponent implements OnInit {
  @Input() currentUser: any;
  @Input() cartCount: number = 0;
  @Input() favoritesCount: number = 0;
  @Input() notificationsCount: number = 0;

  @Output() menuClick = new EventEmitter<string>();
  @Output() orderDeliveryClick = new EventEmitter<void>();
  @Output() showCatalogClick = new EventEmitter<void>();
  @Output() showCartClick = new EventEmitter<void>();
  @Output() showOrdersClick = new EventEmitter<void>();
  @Output() showProfileClick = new EventEmitter<void>();
  @Output() showFavoritesClick = new EventEmitter<void>();
  @Output() showPointsHistoryClick = new EventEmitter<void>();
  @Output() showAddressesClick = new EventEmitter<void>();
  @Output() showNotificationsClick = new EventEmitter<void>();
  @Output() showHelpClick = new EventEmitter<void>();
  @Output() showSettingsClick = new EventEmitter<void>();
  @Output() showPromotionsClick = new EventEmitter<void>();
  @Output() showRecommendationsClick = new EventEmitter<void>();
  @Output() showAdminPanelClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  ngOnInit() {
    // Los event listeners se manejan directamente en el template con (click)
  }

  onMenuClick(action: string) {
    console.log('🎯 DashboardMenu: onMenuClick llamado con acción:', action);
    this.menuClick.emit(action);
    
    // Emitir eventos específicos
    switch(action) {
      case 'orderDelivery':
        console.log('🚚 Emitiendo orderDeliveryClick');
        this.orderDeliveryClick.emit();
        break;
      case 'showCatalog':
        console.log('📦 Emitiendo showCatalogClick');
        this.showCatalogClick.emit();
        break;
      case 'showCart':
        console.log('🛒 Emitiendo showCartClick');
        this.showCartClick.emit();
        break;
      case 'showOrders':
        console.log('📋 Emitiendo showOrdersClick');
        this.showOrdersClick.emit();
        break;
      case 'showProfile':
        this.showProfileClick.emit();
        break;
      case 'showFavorites':
        this.showFavoritesClick.emit();
        break;
      case 'showPointsHistory':
        this.showPointsHistoryClick.emit();
        break;
      case 'showAddresses':
        this.showAddressesClick.emit();
        break;
      case 'showNotifications':
        this.showNotificationsClick.emit();
        break;
      case 'showHelp':
        this.showHelpClick.emit();
        break;
      case 'showSettings':
        this.showSettingsClick.emit();
        break;
      case 'showPromotions':
        this.showPromotionsClick.emit();
        break;
      case 'showRecommendations':
        this.showRecommendationsClick.emit();
        break;
      case 'showAdminPanel':
        this.showAdminPanelClick.emit();
        break;
      case 'logout':
        this.logoutClick.emit();
        break;
    }
  }

  get showAdminButton(): boolean {
    return this.currentUser?.rol === 'admin' || this.currentUser?.rol === 'vendedor';
  }
}

