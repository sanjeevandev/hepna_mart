import { create } from 'zustand';
import { ProjectNotification } from '@/types';
import { apiClient, getAuthToken } from '@/lib/api';

interface NotificationState {
  notifications: ProjectNotification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  filter: 'all' | 'unread';

  setFilter: (filter: 'all' | 'unread') => void;
  fetchNotifications: (page?: number, isRead?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  limit: 20,
  isLoading: false,
  filter: 'all',

  setFilter: (filter) => {
    set({ filter });
    const isRead = filter === 'unread' ? false : undefined;
    get().fetchNotifications(1, isRead);
  },

  fetchNotifications: async (page = 1, isRead) => {
    const token = getAuthToken();
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await apiClient.notifications.list({
        page,
        limit: get().limit,
        is_read: isRead,
      });
      if (res.data) {
        set({
          notifications: res.data.notifications,
          total: res.data.total,
          unreadCount: res.data.unread_count,
          page: res.data.page,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await apiClient.notifications.getUnreadCount();
      if (res.data) {
        set({ unreadCount: res.data.unread_count });
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  },

  markAsRead: async (notificationId: string) => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic UI update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await apiClient.notifications.markRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      get().fetchNotifications(get().page);
    }
  },

  markAllAsRead: async () => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic UI update
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    try {
      await apiClient.notifications.markAllRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      get().fetchNotifications(get().page);
    }
  },
}));
