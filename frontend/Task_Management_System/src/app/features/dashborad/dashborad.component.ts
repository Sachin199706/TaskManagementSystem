import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TaskSummary } from '../../core/services/task.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectTasks, selectTasksLoading, TaskActions, TaskState } from '../../store/task.store';


@Component({
  selector: 'app-dashborad',
  standalone: true,
  imports: [],
  templateUrl: './dashborad.component.html',
  styleUrl: './dashborad.component.css'
})
export class DashboradComponent implements OnInit, OnDestroy {
  myTasks: TaskSummary[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  private store: Store<TaskState> = inject(Store);
  loading$: Observable<boolean> = this.store.select(selectTasksLoading);



  constructor(public auth: AuthService) {
  }

  ngOnInit(): void {
    const userId: number | undefined = this.auth.iobjCurrentUser()?.userId;
    this.store.dispatch(TaskActions.loadTasks(
      {
        criteria: { creatorId: userId, sortBy: 'priority', sortDirection: 'desc', pageSize: 20 }
      }));

    // Properly unsubscribe on destroy
    this.store.select(selectTasks)
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => this.myTasks = tasks);


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  get greeting(): string {
    const lnumHours: number = new Date().getHours();
    if (lnumHours < 12) return "morning";
    else if (lnumHours < 17) return "afternoon";
    return "evening";
  }

  get inProgress(): number {
    return this.myTasks.filter(x => x.status === eTaskStatus.INPROGRESS).length;
  }
  get inReview(): number {
    return this.myTasks.filter(x => x.status === eTaskStatus.REVIEW).length;
  }
  get overdue() {
    return this.myTasks.filter(x => this.isOverdue(x.dueDate) && x.status !== eTaskStatus.COMPLETED && x.status !== eTaskStatus.CANCELLED).length;
  }
  formatStatus(s: string): string {
    return s.replace(/([A-Z])/g, ' $1').trim();
  }

  isOverdue(d: string): boolean {
    return new Date(d) < new Date();
  }


}


export enum eTaskStatus {
  INPROGRESS = "InProgress",
  REVIEW = "Review",
  CANCELLED = "Cancelled",
  COMPLETED = "Completed"

}