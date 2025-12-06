import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-utilities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-utilities.component.html',
  styleUrl: './dashboard-utilities.component.css'
})
export class DashboardUtilitiesComponent {
  @Input() notificationsCount: number = 0;

  @Output() showNotificationsClick = new EventEmitter<void>();
  @Output() showHelpClick = new EventEmitter<void>();
  @Output() showSettingsClick = new EventEmitter<void>();

  onShowNotifications() {
    this.showNotificationsClick.emit();
  }

  onShowHelp() {
    this.showHelpClick.emit();
  }

  onShowSettings() {
    this.showSettingsClick.emit();
  }
}
