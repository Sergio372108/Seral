// src/services/getUserTelegramId.ts
// Busca el telegramId del destinatario en Firestore antes de notificar.

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Devuelve el telegramId del usuario si lo tiene configurado, o null si no.
 */
export async function getUserTelegramId(username: string): Promise<string | null> {
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return data.telegramId?.trim() || null;
  } catch {
    return null;
  }
}