import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ActivityEvent {
  type: string;
  action: string;
  title: string;
  description?: string;
  actor: string;
  actorAvatar?: string;
  repositoryId?: string;
  repositoryName?: string;
  timestamp: string;
  metadata?: any;
}

const socketBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const useSocket = (onActivityReceived?: (event: ActivityEvent) => void) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<ActivityEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to backend event stream. Socket ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ [Socket.IO] Disconnected from backend stream');
      setIsConnected(false);
    });

    socket.on('activity_stream', (event: ActivityEvent) => {
      setLastEvent(event);
      if (onActivityReceived) {
        onActivityReceived(event);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [onActivityReceived]);

  const emitActivity = useCallback((event: Omit<ActivityEvent, 'timestamp'>) => {
    if (socketRef.current) {
      socketRef.current.emit('activity_event', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return {
    isConnected,
    lastEvent,
    emitActivity,
  };
};
