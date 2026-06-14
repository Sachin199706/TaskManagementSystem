import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from "./shared/toast-container/toast-container.component";
import { NotificationBellComponent } from "./features/notification-bell/notification-bell.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, NotificationBellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Task_Management_System';
  showNav = true;
  sidebarCollapsed = false;
  userMenuOpen = false;
  currentTitle = '';
  auth: any; // Replace with actual AuthService type
  
  constructor( private router: Router) { 

  }

  get initials(): string { 
    return this.auth.currebtUser()?.displayName || 'U'
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
