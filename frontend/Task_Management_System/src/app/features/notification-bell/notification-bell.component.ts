import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { INotification, SignalRService } from '../../core/services/signal-r.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent {
  signalR: SignalRService = inject(SignalRService);
  private el: ElementRef = inject(ElementRef);
  open: boolean = false;

  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.el.nativeElement.contains(e.target)) this.open = false;
  }

  onNotifClick(aobjNotification: INotification) {
    this.signalR.markRead(aobjNotification.id)
    this.open = false;

  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      TaskCreated: 'fa-solid fa-list-check',
      StatusChanged: 'fa-solid fa-arrows-rotate',
      Assigned: 'fa-solid fa-user',
      Comment: 'fa-solid fa-comment',
      AdminAlert: 'fa-solid fa-bell'
    };

    return icons[type] ?? 'fa-solid fa-thumbtack';
  }

  timeAgo(aobjDate: Date): string {
    let lnumSec: number = Math.floor((Date.now() - new Date(aobjDate).getTime()) / 1000);
    if (lnumSec < 60) return 'just now';
    if (lnumSec < 3600) return `${Math.floor(lnumSec / 60)}m ago`;
    if (lnumSec < 86400) return `${Math.floor(lnumSec / 3600)}h ago`;
    return `${Math.floor(lnumSec / 86400)}d ago`;

  }

}

