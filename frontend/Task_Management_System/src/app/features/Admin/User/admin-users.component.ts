import { Component, inject, OnInit } from '@angular/core';
import { UserDto, UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {

  private userSvc = inject(UserService);
  private toast = inject(ToastService);

  users: UserDto[] = [];
  filtered: UserDto[] = [];
  total = 0;
  search = '';
  loading = true;

  private readonly avatarColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  avatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  ngOnInit(): void {
    this.userSvc.getAll(1, 100).subscribe({
      next: r => {
        this.users = r.items as unknown as UserDto[];
        this.total = r.total;
        this.filtered = [...this.users];
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load users.');
        this.loading = false;
      }
    });
  }

  filter(): void {
    const s = this.search.toLowerCase();
    this.filtered = s
      ? this.users.filter(u =>
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.displayName.toLowerCase().includes(s))
      : [...this.users];
  }

  toggleRole(u: UserDto): void {
    const newRole = u.role === 'Admin' ? 'User' : 'Admin';
    this.userSvc.changeRole(u.id, newRole).subscribe({
      next: () => {
        u.role = newRole;
        this.toast.success(`${u.displayName} is now ${newRole}`);
      },
      error: () => this.toast.error('Failed to update role.')
    });
  }

  deactivate(id: number): void {
    if (!confirm('Deactivate this user? They will no longer be able to log in.')) return;
    this.userSvc.deactivate(id).subscribe({
      next: () => {
        const u = this.users.find(x => x.id === id);
        if (u) u.isActive = false;
        this.toast.success('User deactivated.');
      },
      error: () => this.toast.error('Failed to deactivate user.')
    });
  }

}
