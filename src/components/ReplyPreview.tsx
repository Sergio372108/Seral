// src/components/ReplyPreview.tsx
// Dos componentes:
//   - ReplyBar: barra sobre el input mostrando a qué mensaje estás respondiendo
//   - ReplyContext: mini preview dentro del mensaje que muestra el mensaje original

// ─── ReplyBar ────────────────────────────────────────────────────────────────
// Se muestra encima del input cuando el usuario pulsa "responder"

interface ReplyBarProps {
  from: string;
  content: string;
  onCancel: () => void;
}

export function ReplyBar({ from, content, onCancel }: ReplyBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-200">
      <div className="w-1 h-8 bg-slate-900 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700">{from}</p>
        <p className="text-xs text-slate-500 truncate">
          {content.length > 60 ? content.slice(0, 60) + '…' : content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="text-slate-400 hover:text-slate-600 text-lg leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}

// ─── ReplyContext ─────────────────────────────────────────────────────────────
// Se muestra dentro del mensaje cuando tiene un replyTo

interface ReplyContextProps {
  from: string;
  content: string;
  isMe: boolean;
}

export function ReplyContext({ from, content, isMe }: ReplyContextProps) {
  return (
    <div
      className={`
        flex items-start gap-1.5 mb-1.5 px-2 py-1.5 rounded-xl text-xs
        ${isMe
          ? 'text-white/90'
          : 'bg-slate-300 text-slate-1000/90'
        }
      `}
      style={isMe ? { background: 'rgba(192, 185, 161, 0.39)' } : {}}
    >
      <div className="w-0.5 h-full min-h-[28px] bg-current opacity-50 rounded-full flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-medium opacity-80">{from}</p>
        <p className="truncate opacity-70">
          {content.length > 50 ? content.slice(0, 50) + '…' : content}
        </p>
      </div>
    </div>
  );
}