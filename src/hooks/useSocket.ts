import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  getDocs,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const API_URL = ''; // Usar URL relativa

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export function useSocket(uid: string | null, username: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Conectar a Socket.io para presencia de usuarios
  useEffect(() => {
    if (!uid || !username) return;

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al servidor');
      
      // Notificar que este usuario está online
      socket.emit('user-online', { uid, username });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado del servidor');
    });

    socket.on('online-users', (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on('user-online', ({ username }: { username: string }) => {
      setOnlineUsers(prev => [...new Set([...prev, username])]);
    });

    socket.on('user-offline', ({ username }: { username: string }) => {
      setOnlineUsers(prev => prev.filter(u => u !== username));
    });

    return () => {
      socket.disconnect();
    };
  }, [uid, username]);

  // Escuchar mensajes de Firestore en tiempo real
  useEffect(() => {
    if (!username) return;

    // Consulta para mensajes donde el usuario es remitente o destinatario
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', username),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const msg: Message = {
          id: doc.id,
          from: data.from,
          to: data.to,
          content: data.content,
          timestamp: data.timestamp,
          read: data.read
        };
        newMessages.push(msg);
        
        if (data.to === username && !data.read) {
          unread++;
        }
      });

      setMessages(newMessages.reverse());
      setUnreadCount(unread);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [username]);

  const sendMessage = useCallback(async (to: string, content: string) => {
    if (!username) return;

    try {
      await addDoc(collection(db, 'messages'), {
        from: username,
        to,
        content,
        timestamp: serverTimestamp(),
        read: false,
        participants: [username, to]
      });

      // Notificar al destinatario vía Socket.io
      socketRef.current?.emit('new-message', { to, from: username, content });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  }, [username]);

  const markAsRead = useCallback(async (from: string) => {
    if (!username) return;

    try {
      // Obtener mensajes no leídos de este remitente
      const q = query(
        collection(db, 'messages'),
        where('from', '==', from),
        where('to', '==', username),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      // Marcar todos como leídos
      const batch = writeBatch(db);
      snapshot.forEach((docSnapshot) => {
        batch.update(doc(db, 'messages', docSnapshot.id), { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  }, [username]);

  return {
    isConnected,
    onlineUsers,
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
  };
}
