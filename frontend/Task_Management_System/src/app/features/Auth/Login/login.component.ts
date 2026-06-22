import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService } from '../../../core/services/signal-r.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loading: boolean = false;
  errorMsg: string = '';
  private fb = inject(FormBuilder);
  private auth: AuthService = inject(AuthService);
  private signalR: SignalRService = inject(SignalRService);
  private router: Router = inject(Router);
  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  get f() { return this.form.controls; }
  showPwd: boolean = false;

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.form.value).subscribe({
      next: async () => {
        await this.signalR.connect();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Login failed. Please try again.';
        this.loading = false;
      }
    });

  }
}
