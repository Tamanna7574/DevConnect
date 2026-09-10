import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useToast } from './ToastContext';
import { Notification } from '@devconnect/shared';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();

  useEffect(() => {
    // Only connect if in browser
    if (typeof window === 'undefined') return;

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
        : window.location.origin);

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        socketInstance.emit('join_user_room', user.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('notification:new', (data: { notification: Notification }) => {
      if (data?.notification) {
        addNotification(data.notification);
        toast('info', data.notification.title, data.notification.message);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.id, addNotification, toast]);

  // Re-join user room whenever active user changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user_room', user.id);
    }
  }, [socket, isConnected, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
