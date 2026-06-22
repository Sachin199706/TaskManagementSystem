import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { selectTasks, selectTasksLoading, selectTasksPagination, TaskActions } from '../../store/task.store';
import { Store } from '@ngrx/store';
import { SignalRService } from '../../core/services/signal-r.service';
import { RouterLink, RouterModule } from '@angular/router';


@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private signalR = inject(SignalRService);
  private destroy$ = new Subject<void>();

  tasks$ = this.store.select(selectTasks);
  loading$ = this.store.select(selectTasksLoading);
  pagination$ = this.store.select(selectTasksPagination);


  searchTitle: string = '';
  filterStatus: string = '';
  filterPriority: string = '';
  sortBy: string = 'priority';
  sortDir: string = 'desc';
  statusModalTask: any = null;

  Math = Math;
  private searchSubject = new Subject<void>();

  private stateTransitions: Record<string, string[]> = {
    'Todo': ['InProgress', 'Cancelled'],
    'InProgress': ['Review', 'Cancelled'],
    'Review': ['Completed', 'InProgress'],
    'Completed': ['InProgress'],
    'Cancelled': ['Todo']
  };


  ngOnInit(): void {
    this.applyFilters();

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    // SignalR updates handled via store dispatch from app.component
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  applyFilters(): void {
    this.store.dispatch(TaskActions.loadTasks({
      criteria: {
        titleContains: this.searchTitle || undefined,
        status: this.filterStatus || undefined,
        priority: this.filterPriority || undefined,
        sortBy: this.sortBy,
        sortDirection: this.sortDir,
        page: 1, pageSize: 20
      }
    }));
  }

  toggleSortDir() {
    this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    this.applyFilters();

  }

  goToPage(page: number): void {
    this.store.dispatch(TaskActions.loadTasks({
      criteria: { page, pageSize: 20, sortBy: this.sortBy, sortDirection: this.sortDir }
    }));
  }

  openStatusModal(task: any): void { this.statusModalTask = task; }
  closeStatusModal(): void { this.statusModalTask = null; }

  changeStatus(id: number, newStatus: string): void {
    this.store.dispatch(TaskActions.changeStatus({ id, newStatus }));
    this.closeStatusModal();
  }

  getAvailableStatuses(current: string): string[] {
    return this.stateTransitions[current] ?? [];
  }

  formatStatus(s: string): string {
    return s.replace(/([A-Z])/g, ' $1').trim();
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }


}
