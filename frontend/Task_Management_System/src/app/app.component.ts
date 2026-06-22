import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from "./shared/toast-container/toast-container.component";
import { NotificationBellComponent } from "./features/notification-bell/notification-bell.component";
import { LoginComponent } from "./features/Auth/Login/login.component";
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { OnInitEffects } from '@ngrx/effects';
import { SignalRService } from './core/services/signal-r.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, NotificationBellComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Task_Management_System';
  showNav: boolean = true;
  sidebarCollapsed = false;
  userMenuOpen = false;
  currentTitle = '';
  auth: AuthService = inject(AuthService);
  private signalR: SignalRService = inject(SignalRService);

  private readonly titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tasks': 'Tasks',
    '/tasks/new': 'New Task',
    '/admin': 'Admin Dashboard',
    '/admin/users': 'User Management',
    '/admin/audit': 'Audit Log',
    '/auth/login': 'Sign In',
    '/auth/register': 'Register',
  };


  constructor(private router: Router) {

  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.showNav = !url.startsWith('/auth');
      // Find longest matching prefix
      const match = Object.keys(this.titleMap)
        .filter(k => url.startsWith(k))
        .sort((a, b) => b.length - a.length)[0];
      this.currentTitle = match ? this.titleMap[match] : 'Task Manager';
      this.userMenuOpen = false;
    });

    if (this.auth.isLoggedIn()) {
      this.signalR.connect();
    }
  }

  get initials(): string {
    return this.auth.iobjCurrentUser()?.displayName || 'U'
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();

  }
  logout() {
    this.auth.logOut();
    this.router.navigate(['/login']);
  }
}
