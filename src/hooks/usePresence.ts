import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UserPresence {
  username: string;
  online: boolean;
  lastSeen: any;
}

export function usePresence(currentUid: string | null, currentUsername: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);

  // Escuchar usuarios en tiempo real
  useEffect(() => {
    if (!currentUsername) return;

    const usersQuery = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const users: UserPresence[] = [];
      const online: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username && data.username !== currentUsername) {
          users.push({
            username: data.username,
            online: data.online || false,
            lastSeen: data.lastSeen
          });
          
          if (data.online) {
            online.push(data.username);
          }
        }
      });
      
      setAllUsers(users);
      setOnlineUsers(online);
    }, (err) => {
      console.error('Error en usePresence:', err);
    });

    return () => unsubscribe();
  }, [currentUsername]);

  // Actualizar estado online del usuario actual
  useEffect(() => {
    if (!currentUid || !currentUsername) return;

    let heartbeatInterval: ReturnType<typeof setInterval>;

    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        const userRef = doc(db, 'users', currentUid);
        const userDoc = await getDoc(userRef);
        
        const userData = {
          username: currentUsername,
          online: isOnline,
          lastSeen: serverTimestamp()
        };
        
        if (userDoc.exists()) {
          await updateDoc(userRef, userData);
        } else {
          await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error al actualizar estado:', error);
      }
    };

    // Marcar como online al montar
    updateOnlineStatus(true);

    // Heartbeat cada 20 segundos para mantener online
    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus(true);
      }
    }, 20000);

    // Manejar visibilidad de la página
    const handleVisibilityChange = () => {
      updateOnlineStatus(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Manejar cierre de página
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      updateOnlineStatus(false);
    };
  }, [currentUid, currentUsername]);

  const isUserOnline = useCallback((username: string): boolean => {
    return onlineUsers.includes(username);
  }, [onlineUsers]);

  return {
    onlineUsers,
    allUsers,
    isUserOnline
  };
}
