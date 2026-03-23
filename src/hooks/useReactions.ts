// src/hooks/useReactions.ts
// Guarda las reacciones directamente en el campo 'reactions' del mensaje.
// Estructura en Firestore: { reactions: { "❤️": ["user1","user2"], "😂": ["user3"] } }
// No requiere índices ni colecciones extra.

import { useCallback } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type ReactionsMap = Record<string, string[]>; // emoji → lista de usernames

/** Añade o quita una reacción de un mensaje. Toggle: si ya la puso, la quita. */
export function useReactions(currentUsername: string | null) {
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!currentUsername || !messageId) return;

      try {
        const ref      = doc(db, 'messages', messageId);
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) return;

        const data     = snapshot.data();
        const reactions: ReactionsMap = data.reactions ?? {};
        const users    = reactions[emoji] ?? [];

        // Toggle: si el usuario ya reaccionó, la quita; si no, la añade
        const updated = users.includes(currentUsername)
          ? users.filter(u => u !== currentUsername)
          : [...users, currentUsername];

        // Si queda vacía, eliminamos la clave del emoji
        if (updated.length === 0) {
          const { [emoji]: _, ...rest } = reactions;
          await updateDoc(ref, { reactions: rest });
        } else {
          await updateDoc(ref, { reactions: { ...reactions, [emoji]: updated } });
        }
      } catch (err) {
        console.error('[useReactions] toggleReaction error:', err);
      }
    },
    [currentUsername]
  );

  return { toggleReaction };
}