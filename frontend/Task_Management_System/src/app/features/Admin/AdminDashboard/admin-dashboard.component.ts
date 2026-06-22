import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SignalRService } from '../../../core/services/signal-r.service';
import { AdminMetrics, ChangeLog, PagedResult } from '../../../core/services/task.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private adminSvc = inject(AdminService);
  signalR = inject(SignalRService);

  metrics: AdminMetrics | null = null;
  auditLogs: PagedResult<ChangeLog> | null = null;

  ngOnInit(): void {
    this.adminSvc.getMetrics().subscribe(m => this.metrics = m);
    this.adminSvc.getAuditLogs(1, 10).subscribe(l => this.auditLogs = l);
    this.signalR.joinAdminGroup();
  }

  pct(val: number, total: number): number {
    return total ? Math.round((val / total) * 100) : 0;
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = {
      'TaskCreated': '📝', 'StatusChanged': '🔄', 'Assigned': '👤',
      'Comment': '💬', 'AdminAlert': '🔔'
    };
    return icons[type] ?? '📌';
  }
}
