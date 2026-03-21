import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { sendTelegramNotification } from '@/services/telegramNotifier';
import { getUserTelegramId } from '@/services/getUserTelegramId';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Timestamp | null;
  read: boolean;
  participants: string[];
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const CACHE_KEY   = (u: string) => `chat_v5_${u}`;
const LAST_USER_KEY = 'chat_last_user_v5';

function saveLastUser(u: string) {
  try { localStorage.setItem(LAST_USER_KEY, u); } catch { /**/ }
}
function getLastUser(): string | null {
  try { return localStorage.getItem(LAST_USER_KEY); } catch { return null; }
}

function saveCache(username: string, msgs: Message[]): void {
  try {
    const data = msgs
      .filter(m => !m.id.startsWith('tmp_'))
      .map(m => ({
        ...m,
        timestamp: m.timestamp
          ? { s: m.timestamp.seconds, ns: m.timestamp.nanoseconds }
          : null,
      }));
    localStorage.setItem(CACHE_KEY(username), JSON.stringify(data));
  } catch { /**/ }
}

function loadCache(username: string): Message[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(username));
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map(m => ({
      ...m,
      timestamp: m.timestamp ? new Timestamp(m.timestamp.s, m.timestamp.ns) : null,
    }));
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToMessage(d: QueryDocumentSnapshot): Message {
  const data = d.data();
  return {
    id: d.id,
    from: data.from,
    to: data.to,
    content: data.content,
    timestamp: data.timestamp ?? null,
    read: data.read ?? false,
    participants: data.participants ?? [data.from, data.to],
  };
}

/** Combina dos arrays, elimina duplicados por id, ordena por timestamp en JS */
function mergeAndSort(a: Message[], b: Message[]): Message[] {
  const map = new Map<string, Message>();
  [...a, ...b].forEach(m => map.set(m.id, m));
  return Array.from(map.values()).sort(
    (x, y) => (x.timestamp?.toMillis() ?? 0) - (y.timestamp?.toMillis() ?? 0)
  );
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

async function requestNotificationPermission(): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
}

function showNotification(from: string, content: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    // `renotify` existe en browsers modernos, pero en algunas versiones de la lib DOM de TS
    // no está tipado. Se fuerza con cast para evitar el error sin cambiar comportamiento.
    new Notification(`💬 Nuevo mensaje de ${from}`, {
      body: content.length > 80 ? content.slice(0, 80) + '…' : content,
      icon: '/favicon.ico',
      tag: `msg_${from}`,
      ...( { renotify: true } as NotificationOptions ),
    });
  } catch { /**/ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages(currentUsername: string | null) {
  /**
   * CLAVE: inicializar con el caché del último usuario ANTES de que auth resuelva.
   * currentUsername es null en el primer render (Firebase Auth es asíncrono).
   * Guardamos el último usuario logueado en localStorage para poder cargar
   * su caché inmediatamente, sin esperar a onAuthStateChanged.
   */
  const [messages, setMessages] = useState<Message[]>(() => {
    const user = currentUsername ?? getLastUser();
    return user ? loadCache(user) : [];
  });
  const [loading, setLoading] = useState(true);

  // Refs para combinar los dos snapshots sin race conditions
  const sentRef    = useRef<Message[]>([]);
  const recvRef    = useRef<Message[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const usernameRef = useRef<string | null>(null);

  useEffect(() => { requestNotificationPermission(); }, []);

  // Guardar último usuario en cuanto auth resuelva
  useEffect(() => {
    if (currentUsername) saveLastUser(currentUsername);
  }, [currentUsername]);

  // ── Listeners ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUsername) {
      // Auth aún no resolvió — mantener caché visible, no borrar nada
      setLoading(false);
      return;
    }

    const username = currentUsername;
    usernameRef.current = username;
    sentRef.current     = [];
    recvRef.current     = [];

    // Mostrar caché mientras llegan los datos de Firestore
    const cached = loadCache(username);
    setMessages(cached);
    prevIdsRef.current = new Set(cached.map(m => m.id));
    setLoading(true);

    /**
     * Combina sent + received, ordena, notifica nuevos y persiste en caché.
     * SIN orderBy en las queries → CERO índices requeridos en Firestore.
     * El orden se resuelve aquí en el cliente.
     */
    function applyFresh(): void {
      const merged = mergeAndSort(sentRef.current, recvRef.current);

      // Notificar mensajes nuevos recibidos
      merged.forEach(msg => {
        if (
          !prevIdsRef.current.has(msg.id) &&
          msg.to === username &&
          msg.timestamp !== null
        ) {
          showNotification(msg.from, msg.content);
        }
      });

      prevIdsRef.current = new Set(merged.map(m => m.id));

      setMessages(merged);
      saveCache(username, merged); // persistir SIEMPRE
      setLoading(false);
    }

    /**
     * DOS queries simples SIN orderBy.
     * - where('from') y where('to') son índices de campo único → se crean
     *   automáticamente en Firestore, no hay que hacer nada en la consola.
     * - El orden lo hace mergeAndSort() en el cliente.
     */
    const unsubSent = onSnapshot(
      query(
        collection(db, 'messages'),
        where('from', '==', currentUsername)
        // SIN orderBy — no requiere índice compuesto
      ),
      snap => {
        sentRef.current = snap.docs.map(docToMessage);
        applyFresh();
      },
      err => {
        console.error('[useMessages] sent error:', err);
        setLoading(false);
      }
    );

    const unsubReceived = onSnapshot(
      query(
        collection(db, 'messages'),
        where('to', '==', currentUsername)
        // SIN orderBy — no requiere índice compuesto
      ),
      snap => {
        recvRef.current = snap.docs.map(docToMessage);
        applyFresh();
      },
      err => {
        console.error('[useMessages] received error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [currentUsername]);

  // ── sendMessage ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (to: string, content: string): Promise<boolean> => {
      const username = usernameRef.current;
      if (!username || !to || !content.trim()) return false;

      const trimmed = content.trim();
      const tempId  = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // Optimistic update: aparece al instante
      const optimistic: Message = {
        id: tempId,
        from: username,
        to,
        content: trimmed,
        timestamp: Timestamp.now(),
        read: false,
        participants: [username, to],
      };

      setMessages(prev => mergeAndSort([...prev, optimistic], []));

      try {
        await addDoc(collection(db, 'messages'), {
          from: username,
          to,
          content: trimmed,
          timestamp: serverTimestamp(),
          read: false,
          participants: [username, to],
        });
        // Una sola llamada: admin recibe siempre + destinatario si tiene ID
        getUserTelegramId(to)
          .then(chatId => { sendTelegramNotification(username, to, trimmed, chatId); })
          .catch(() => { sendTelegramNotification(username, to, trimmed, null); });

        // onSnapshot reemplaza sentRef.current → el tempId desaparece solo
        return true;
      } catch (error: any) {
        console.error('[useMessages] sendMessage error:', error.code, error.message);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return false;
      }
    },
    []
  );

  // ── markMessagesAsRead ──────────────────────────────────────────────────────
  const markMessagesAsRead = useCallback(
    async (fromUser: string): Promise<void> => {
      const username = usernameRef.current;
      if (!username || !fromUser) return;
      try {
        const snap = await getDocs(query(
          collection(db, 'messages'),
          where('from', '==', fromUser),
          where('to',   '==', username),
          where('read', '==', false)
        ));
        if (snap.empty) return;
        const batch = writeBatch(db);
        snap.forEach(d => batch.update(doc(db, 'messages', d.id), { read: true }));
        await batch.commit();
        // El listener actualizará el estado automáticamente
      } catch (err) {
        console.error('[useMessages] markMessagesAsRead:', err);
      }
    },
    []
  );

  // ── Selectores ──────────────────────────────────────────────────────────────

  const getMessagesWithUser = useCallback(
    (otherUser: string | null): Message[] => {
      const username = usernameRef.current;
      if (!otherUser || !username) return [];
      return messages.filter(
        m =>
          (m.from === username && m.to === otherUser) ||
          (m.from === otherUser && m.to === username)
      );
    },
    [messages]
  );

  const getUnreadCountFromUser = useCallback(
    (fromUser: string): number => {
      const username = usernameRef.current;
      if (!username) return 0;
      return messages.filter(
        m => m.from === fromUser && m.to === username && !m.read
      ).length;
    },
    [messages]
  );

  const totalUnreadCount = messages.filter(
    m => m.to === currentUsername && !m.read
  ).length;

  return {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead,
    getMessagesWithUser,
    getUnreadCountFromUser,
    totalUnreadCount,
  };
}