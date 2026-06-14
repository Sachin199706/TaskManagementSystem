import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminMetrics, ChangeLog, PagedResult } from './task.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly base = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) { }

  getMetrics(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.base}/metrics`);
  }

  getAuditLogs(page = 1, pageSize = 20): Observable<PagedResult<ChangeLog>> {
    return this.http.get<PagedResult<ChangeLog>>(
      `${this.base}/audit-logs?page=${page}&pageSize=${pageSize}`);
  }
}
