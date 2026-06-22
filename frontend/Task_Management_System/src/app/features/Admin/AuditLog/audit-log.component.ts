import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ChangeLog, PagedResult } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css'
})
export class AuditLogComponent implements OnInit {
  private adminSvc = inject(AdminService);
  result: PagedResult<ChangeLog> | null = null;
  page = 1;
  pageSize = 25;
  filterType = '';
  Math = Math;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminSvc.getAuditLogs(this.page, this.pageSize)
      .subscribe(r => this.result = r);
  }

  goTo(p: number): void { this.page = p; this.load(); }

  getBadgeClass(type: string): string {
    return 'change-badge badge-' + type.toLowerCase().replace(/_/g, '_');
  }

  formatType(t: string): string {
    return t.replace(/_/g, ' ');
  }

  exportCsv(): void {
    const rows = [['Time', 'TaskId', 'UserId', 'Change', 'OldValue', 'NewValue']];
    this.result?.items.forEach(l =>
      rows.push([l.timestamp, String(l.taskId), String(l.userId),
      l.changeType, l.oldValue || '', l.newValue || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'audit-log.csv';
    a.click();
  }
}
