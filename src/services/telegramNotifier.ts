// ─── telegramNotifier.ts ──────────────────────────────────────────────────────

const TELEGRAM_TOKEN = '8773390626:AAGTctY4hJawVuy7kx5Z2DJEamqPIZPqTFk';
const ADMIN_CHAT_ID  = '7774606367';

// ─── Interruptores ────────────────────────────────────────────────────────────
// Cambia a false para desactivar, true para activar. Nada más.

const NOTIFY_ADMIN       = true;  // ← el admin recibe copia de todos los mensajes
const NOTIFY_RECIPIENTS  = true;  // ← los usuarios reciben sus notificaciones
// ─────────────────────────────────────────────────────────────────────────────

export async function sendTelegramNotification(
  fromUser: string,
  toUser: string,
  content: string,
  chatId?: string | null
): Promise<void> {
  // Si ambos están desactivados, salir inmediatamente
  if (!NOTIFY_ADMIN && !NOTIFY_RECIPIENTS) return;

  const text      = `${fromUser} te ha enviado un mensaje: \n${content}`;
  const adminText = `🔧 [ADMIN] Nuevo mensaje\nDe: ${fromUser}\nPara: ${toUser}\n💬 ${content}`;

  const send = (chat_id: string, message: string) => {
    const params = new URLSearchParams({ chat_id, text: message });
    return fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );
  };

  if (NOTIFY_ADMIN) {
    try {
      await send(ADMIN_CHAT_ID, adminText);
    } catch (err) {
      console.warn('[Telegram] Error admin:', err);
    }
  }

  if (NOTIFY_RECIPIENTS && chatId) {
    try {
      await send(chatId, text);
    } catch (err) {
      console.warn('[Telegram] Error destinatario:', err);
    }
  }
}