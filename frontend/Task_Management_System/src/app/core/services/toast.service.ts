import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  toasts = signal<Toast[]>([]);

  constructor() { }

  private show(message: string, type: ToastType=ToastType.Info, duration = 4000): void
  {
    const toast: Toast = { id: crypto.randomUUID(), type, message, duration };
    this.toasts.update(t => [...t, toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }
  
  success(message: string): void {
    this.show(message, ToastType.Success);
  }
  error(message: string): void   {
    this.show(message, ToastType.Error, 6000);
  }
  info(message: string): void    {
    this.show(message, ToastType.Info);
  }
  warning(message: string): void {
    this.show(message, ToastType.Warning);
  }

dismiss(id: string): void {
  this.toasts.update(t => t.filter(toast => toast.id !== id));
}
}


