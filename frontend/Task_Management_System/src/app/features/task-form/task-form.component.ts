import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TaskActions } from '../../store/task.store';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent implements OnInit {
  isEdit: boolean = false;
  isSubtask: boolean = false;
  parentId: number | null = null;
  taskId: number | null = null;
  loading: boolean = false;
  errorMsg = '';
  successMsg = '';
  tags: string[] = [];
  tagInput = '';

  form!: FormGroup;

  priorities = [
    { value: 'Urgent', label: 'Urgent', icon: 'fa-solid fa-circle priority-urgent' },
    { value: 'High', label: 'High', icon: 'fa-solid fa-circle priority-high' },
    { value: 'Medium', label: 'Medium', icon: 'fa-solid fa-circle priority-medium' },
    { value: 'Low', label: 'Low', icon: 'fa-solid fa-circle priority-low' },
  ];

  private store: Store = inject(Store);
  private router: Router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);


  private taskSvc: TaskService = inject(TaskService);
  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.taskId = params.get('id') ? +params.get('id')! : null;
    this.parentId = params.get('parentId') ? +params.get('parentId')! : null;
    this.isEdit = !!this.taskId && !this.route.snapshot.url.some(s => s.path === 'subtask');
    this.isSubtask = !!this.parentId;

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      dueDate: ['', Validators.required],
      priority: ['Medium', Validators.required],
    });

    if (this.isEdit && this.taskId) {
      this.taskSvc.getById(this.taskId).subscribe(t => {
        this.form.patchValue({
          title: t.title, description: t.description,
          dueDate: t.dueDate.substring(0, 10),
          priority: t.priority
        });
        this.tags = [...t.tags];
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const req = { ...this.form.value, tags: this.tags };

    if (this.isEdit && this.taskId) {
      this.store.dispatch(TaskActions.updateTask({ id: this.taskId, req }));
      this.successMsg = 'Task updated!';
      this.loading = false;
      setTimeout(() => this.router.navigate(['/tasks', this.taskId]), 1000);
    } else if (this.isSubtask && this.parentId) {
      this.taskSvc.addSubtask(this.parentId, req).subscribe({
        next: (t) => this.router.navigate(['/tasks', t.id]),
        error: (err) => { this.errorMsg = err.error?.error || 'Failed.'; this.loading = false; }
      });
    } else {
      this.store.dispatch(TaskActions.createTask({ req }));
      this.loading = false;
      this.router.navigate(['/tasks']);
    }

  }

  invalid(astrType: string): boolean {
    const lobjData: any = this.form.get(astrType);
    return !!(lobjData?.invalid && lobjData?.touched);

  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  addTag(e: Event): void {
    e.preventDefault();
    const v = this.tagInput.trim();
    if (v && !this.tags.includes(v)) this.tags.push(v);
    this.tagInput = '';
  }
}
