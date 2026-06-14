import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';

type SocketEventHandler = (data: any) => void;

let socketInstance: any = null;

function getSocket(token: string) {
  if (socketInstance?.connected) return socketInstance;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  const connectSocket = () => {
    import('socket.io-client').then(({ io }) => {
      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }).catch(() => {});
  };

  connectSocket();
  return socketInstance;
}

export function useSocket() {
  const { token } = useAuthStore();
  const socketRef = useRef<any>(null);
  const listenersRef = useRef<Map<string, SocketEventHandler>>(new Map());

  useEffect(() => {
    if (!token) return;
    socketRef.current = getSocket(token);

    return () => {
      listenersRef.current.forEach((handler, event) => {
        socketRef.current?.off(event, handler);
      });
    };
  }, [token]);

  const on = useCallback((event: string, handler: SocketEventHandler) => {
    socketRef.current?.on(event, handler);
    listenersRef.current.set(event, handler);
  }, []);

  const off = useCallback((event: string) => {
    const handler = listenersRef.current.get(event);
    if (handler) {
      socketRef.current?.off(event, handler);
      listenersRef.current.delete(event);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinChat = useCallback((threadId: string) => {
    socketRef.current?.emit('join:chat', threadId);
  }, []);

  const leaveChat = useCallback((threadId: string) => {
    socketRef.current?.emit('leave:chat', threadId);
  }, []);

  const sendTyping = useCallback((threadId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { threadId, isTyping });
  }, []);

  return { on, off, emit, joinChat, leaveChat, sendTyping, socket: socketRef.current };
}

export function useNotificationSocket(onNotification: (n: any) => void) {
  const { on, off } = useSocket();

  useEffect(() => {
    on('notification:new', onNotification);
    return () => off('notification:new');
  }, [on, off, onNotification]);
}
