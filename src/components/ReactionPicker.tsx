// src/components/ReactionPicker.tsx
// Dos componentes en un solo archivo:
//   - ReactionPicker: selector de emojis rápidos para reaccionar
//   - MessageReactions: muestra las reacciones debajo del mensaje

import type { ReactionsMap } from '@/hooks/useReactions';

// Emojis disponibles para reaccionar — los más usados en chats
const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

// ─── ReactionPicker ───────────────────────────────────────────────────────────

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose:  () => void;
  isMe:     boolean; // para posicionarlo a la izquierda o derecha
}

export function ReactionPicker({ onSelect, onClose, isMe }: ReactionPickerProps) {
  return (
    <>
      {/* Overlay invisible para cerrar al pulsar fuera */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      <div className={`
        absolute -top-12 z-20
        bg-white border border-slate-200 rounded-full shadow-lg
        flex items-center gap-0.5 px-2 py-1
        ${isMe ? 'right-0' : 'left-0'}
      `}>
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── MessageReactions ─────────────────────────────────────────────────────────

interface MessageReactionsProps {
  reactions:       ReactionsMap;
  currentUsername: string;
  onToggle:        (emoji: string) => void;
  isMe:            boolean;
}

export function MessageReactions({
  reactions,
  currentUsername,
  onToggle,
  isMe,
}: MessageReactionsProps) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {entries.map(([emoji, users]) => {
        const iReacted = users.includes(currentUsername);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            title={users.join(', ')}
            className={`
              flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs
              border transition-colors
              ${iReacted
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <span>{emoji}</span>
            <span className="font-medium">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}