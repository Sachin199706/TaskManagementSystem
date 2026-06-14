import { emitDistinctChangesOnlyDefaultValue } from '@angular/compiler';
import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface INotification {
  id: string;
  type: string;
  message: string;
  taskId?: number;
  timestamp: Date;
  read: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hub!: signalR.HubConnection;
  notifications = signal<INotification[]>([]);
  unreadCount = signal<number>(0);
  connectionState = signal<string>('Disconnected');
  constructor(private auth: AuthService) { }

  //#region Public Methods

  markAllRead(): void {
    this.notifications.update(ns => ns.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  markRead(id: string): void {
    this.notifications.update(ns =>
      ns.map(n => n.id === id ? { ...n, read: true } : n));
    this.unreadCount.update(c => Math.max(0, c - 1));
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  //#endregion

  //#region Private Methods
  private addNotification(astrType: string, astrMessage: string, anumTaskID?: number): void {
    const lobjNewNotification: INotification = {
      id: this.generateUniqueId(),
      type: astrType,
      message: astrMessage,
      taskId: anumTaskID,
      timestamp: new Date(),
      read: false
    }

    this.notifications.update(ns => [lobjNewNotification, ...ns].slice(0, 50)); // Keep only the latest 50 notifications
    this.unreadCount.update(c => c + 1);


  }

  private generateUniqueId(): string {
    return crypto.randomUUID();
  }

  private isConnected(): boolean {
    return this.hub && this.hub.state === signalR.HubConnectionState.Connected;
  }

  //#endregion

  //#region SignalR Connection Methods

  async connect(): Promise<void> {
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalRUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.auth.getAccessToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.onreconnecting(() => this.connectionState.set('Reconnecting'));
    this.hub.onreconnected(() => this.connectionState.set('Connected'));
    this.hub.onclose(() => this.connectionState.set('Disconnected'));

    // Register event handlers
    this.hub.on('TaskCreated', (payload) => this.addNotification('TaskCreated',
      `Task "${payload.title}" was created.`, payload.taskId));

    this.hub.on('TaskStatusChanged', (payload) => this.addNotification('StatusChanged',
      `Task #${payload.taskId} moved to ${payload.newStatus}`, payload.taskId));

    this.hub.on('TaskAssigned', (payload) => this.addNotification('Assigned',
      payload.message, payload.taskId));

    this.hub.on('CommentAdded', (payload) => this.addNotification('Comment',
      `New comment on task #${payload.taskId}`, payload.taskId));

    this.hub.on('AdminTaskCreated', (payload) => this.addNotification('AdminAlert',
      `[Admin] New task created: #${payload.taskId}`, payload.taskId));

    try {
      await this.hub.start();
      this.connectionState.set('Connected');
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.connectionState.set('Failed');
    }

  }

  async joinTaskGroup(taskId: number): Promise<void> {
    if (this.isConnected()) {
      await this.hub.invoke('JoinTaskGroup', taskId);
    }
  }

  async leaveTaskGroup(taskId: number): Promise<void> {
    if (this.isConnected()) {
      await this.hub.invoke('LeaveTaskGroup', taskId);
    }
  }

  async joinAdminGroup(): Promise<void> {
    if (this.isConnected()) {
      await this.hub.invoke('JoinAdminGroup');
    }
  }

  async disconnect(): Promise<void> {
    if (this.hub) {
      await this.hub.stop();
      this.connectionState.set('Disconnected');
    }
  }

  //#endregion  









}
