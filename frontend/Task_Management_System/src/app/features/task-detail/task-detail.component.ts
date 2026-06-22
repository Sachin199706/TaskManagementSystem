import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSelectedTask, selectTasksLoading, TaskActions } from '../../store/task.store';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { TaskDetail, TaskService, Comment, ChangeLog } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../core/services/signal-r.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  private store: Store = inject(Store);
  private router: Router = inject(Router);
  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private taskSvc: TaskService = inject(TaskService);
  private signalR: SignalRService = inject(SignalRService);

  auth: AuthService = inject(AuthService);


  private taskId!: number;
  private stateTransitions: Record<string, string[]> = {
    'Todo': ['InProgress', 'Cancelled'],
    'InProgress': ['Review', 'Cancelled'],
    'Review': ['Completed', 'InProgress'],
    'Completed': ['InProgress'],
    'Cancelled': ['Todo']
  };
  history: ChangeLog[] = [];
  newComment = '';
  assigneeId: number | null = null;
  subscribed: boolean = false;
  comments: Comment[] = [];



  loading$: Observable<boolean> = this.store.select(selectTasksLoading);
  task$: Observable<TaskDetail | null> = this.store.select(selectSelectedTask);

  ngOnInit(): void {
    this.taskId = +this.activatedRoute.snapshot.paramMap.get('id')!;
    this.store.dispatch(TaskActions.loadTask({ id: this.taskId }));
    this.loadComments();
    this.loadHistory();
    this.signalR.joinTaskGroup(this.taskId).catch(e => console.warn('SignalR group join failed', e));

  }
  ngOnDestroy(): void {
    this.signalR.leaveTaskGroup(this.taskId).catch(e => console.warn('SignalR leave failed', e));

  }

  loadComments(): void {
    this.taskSvc.getComments(this.taskId).subscribe(c => this.comments = c);
  }

  loadHistory(): void {
    this.taskSvc.getHistory(this.taskId).subscribe(h => this.history = h);
  }



  changeStatus(id: number, newStatus: string): void {
    this.store.dispatch(TaskActions.changeStatus({ id, newStatus }));
  }

  getAvailableStatuses(astrCurrent: string): string[] {
    return this.stateTransitions[astrCurrent] ?? [];
  }

  formatStatus(s: string): string {
    return s.replace(/([A-Z])/g, ' $1').trim();
  }
  isOverdue(d: string): boolean {
    return new Date(d) < new Date();
  }


  toggleSubscribe(): void {
    if (this.subscribed) {
      this.taskSvc.unsubscribe(this.taskId).subscribe({
        next: _ => {
          this.subscribed = false;
        }
      })
      return;
    }

    this.taskSvc.subscribe(this.taskId).subscribe({
      next: _ => {
        this.subscribed = true;
      }
    })

  }

  getChangeIcon(type: string): string {
    const icons: Record<string, string> = {
      'CREATED': 'fa-solid fa-sparkles',
      'UPDATED': 'fa-solid fa-pen-to-square',
      'STATUS_CHANGED': 'fa-solid fa-rotate',
      'ASSIGNED': 'fa-solid fa-user-check',
      'PRIORITY_CHANGED': 'fa-solid fa-triangle-exclamation'
    };

    return icons[type] ?? 'fa-solid fa-thumbtack';
  }

  assignTask(taskId: number): void {
    if (!this.assigneeId) return;
    this.taskSvc.assign(taskId, this.assigneeId).subscribe(() => {
      this.store.dispatch(TaskActions.loadTask({ id: taskId }));
      this.assigneeId = null;
    });
  }

  addComment(taskId: number): void {
    if (!this.newComment.trim()) return;
    this.taskSvc.addComment(taskId, this.newComment).subscribe({
      next: (c: Comment) => {
        this.comments = [c, ...this.comments];
        this.newComment = '';
      }
    });
  }
  deleteTask(id: number): void {
    if (confirm('Delete this task permanently?')) {
      this.store.dispatch(TaskActions.deleteTask({ id }));
      this.router.navigate(['/tasks']);

    }
  }
}
