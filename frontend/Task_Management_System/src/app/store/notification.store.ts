import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";
import { INotification } from "../core/services/signal-r.service";


export interface NotificationsState {
    items: INotification[];
    unreadCount: number;
}

const initialState: NotificationsState = { items: [], unreadCount: 0 };

export const NotificationActions = {
    add: createAction('[Notifications] Add', props<{ notification: INotification }>()),
    markRead: createAction('[Notifications] Mark Read', props<{ id: string }>()),
    markAllRead: createAction('[Notifications] Mark All Read'),
    clearAll: createAction('[Notifications] Clear All'),
};

export const notificationsReducer = createReducer(initialState,
    on(NotificationActions.add, (s, { notification }) => ({
        items: [notification, ...s.items].slice(0, 50),
        unreadCount: s.unreadCount + 1
    })),
    on(NotificationActions.markRead, (s, { id }) => ({
        ...s,
        items: s.items.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1)
    })),
    on(NotificationActions.markAllRead, s => ({
        ...s, items: s.items.map(n => ({ ...n, read: true })), unreadCount: 0
    })),
    on(NotificationActions.clearAll, () => initialState),
);

const selectFeature = createFeatureSelector<NotificationsState>('notifications');
export const selectNotifications = createSelector(selectFeature, s => s.items);
export const selectUnreadCount = createSelector(selectFeature, s => s.unreadCount);
