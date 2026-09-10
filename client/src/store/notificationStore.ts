import { create } from 'zustand';
import { Notification, ApiResponse } from '@devconnect/shared';
import { apiClient } from '../api/client';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get<ApiResponse<{ items: Notification[]; unreadCount: number }>>('/notifications');
      if (res.data.success && res.data.data) {
        set({
          notifications: res.data.data.items,
          unreadCount: res.data.data.unreadCount,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (notification: Notification) => {
    const current = get().notifications;
    set({
      notifications: [notification, ...current],
      unreadCount: get().unreadCount + 1,
    });
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  },
}));
