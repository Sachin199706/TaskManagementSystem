import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly base = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) { }

  getById(id: number): Observable<TaskDetail> {
    return this.http.get<TaskDetail>(`${this.base}/${id}`);
  }

  search(criteria: SearchCriteria): Observable<PagedResult<TaskSummary>> {
    let params = new HttpParams();
    Object.entries(criteria).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<TaskSummary>>(`${this.base}/search`, { params });
  }

  create(req: CreateTaskRequest): Observable<TaskDetail> {
    return this.http.post<TaskDetail>(this.base, req);
  }

  update(id: number, req: CreateTaskRequest): Observable<TaskDetail> {
    return this.http.put<TaskDetail>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  changeStatus(id: number, newStatus: string): Observable<TaskDetail> {
    return this.http.patch<TaskDetail>(`${this.base}/${id}/status`, { newStatus });
  }

  assign(id: number, assigneeId: number): Observable<TaskDetail> {
    return this.http.post<TaskDetail>(`${this.base}/${id}/assign`, { assigneeId });
  }

  addSubtask(parentId: number, req: CreateTaskRequest): Observable<TaskDetail> {
    return this.http.post<TaskDetail>(`${this.base}/${parentId}/subtasks`, req);
  }

  getSubtasks(parentId: number): Observable<TaskSummary[]> {
    return this.http.get<TaskSummary[]>(`${this.base}/${parentId}/subtasks`);
  }

  getHistory(id: number): Observable<ChangeLog[]> {
    return this.http.get<ChangeLog[]>(`${this.base}/${id}/history`);
  }

  getComments(id: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${id}/comments`);
  }

  addComment(id: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${id}/comments`, { content });
  }

  subscribe(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/subscribe`, {});
  }

  unsubscribe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/subscribe`);
  }


}


export interface TaskDetail {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  creatorId: number;
  assigneeId?: number;
  parentTaskId?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  subtasks: TaskSummary[];
}

export interface TaskSummary {
  id: number;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
  assigneeId?: number;
  hasSubtasks: boolean;
  subtaskCount: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchCriteria {
  assigneeId?: number;
  creatorId?: number;
  priority?: string;
  status?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  hasSubtasks?: boolean;
  titleContains?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  tags?: string[];
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface ChangeLog {
  id: number;
  taskId: number;
  userId: number;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface AdminMetrics {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  completedCount: number;
  cancelledCount: number;
  overdueCount: number;
  urgentCount: number;
}