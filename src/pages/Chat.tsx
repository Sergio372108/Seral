import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  LogOut,
  Users,
  ChevronLeft,
  ChevronDown,
  Bell,
  MessageSquare,
  Check,
  CheckCheck,
  Smile,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { EmojiPicker } from '@/components/EmojiPicker';
import { GifPicker } from '@/components/GifPicker';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export function Chat() {
  const { user, logout } = useAuth();
  const currentUsername = user?.username || null;

  const {
    messages,
    loading,
    sendMessage,
    markMessagesAsRead,
    getMessagesWithUser,
    getUnreadCountFromUser,
    totalUnreadCount,
  } = useMessages(currentUsername);

  const { allUsers, isUserOnline } = usePresence(user?.uid || null, currentUsername);

  const [selectedUser, setSelectedUser]     = useState<string | null>(null);
  const [inputMessage, setInputMessage]     = useState('');
  const [showSidebar, setShowSidebar]       = useState(true);
  const [sending, setSending]               = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker]   = useState(false);
  const [showGifPicker, setShowGifPicker]       = useState(false);

  // Refs para scroll — usamos div normal en lugar de ScrollArea
  // porque ScrollArea de shadcn no propaga height correctamente con flex-1
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);

  // ── Mensajes filtrados para la conversación activa ─────────────────────────
  const currentMessages = useMemo(() => {
    if (!selectedUser || !currentUsername) return [];
    return getMessagesWithUser(selectedUser);
  }, [messages, selectedUser, currentUsername, getMessagesWithUser]);

  // ── Scroll al fondo cuando llegan mensajes nuevos ──────────────────────────
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || currentMessages.length <= 1) {
      el.scrollTop = el.scrollHeight;
    }
  }, [currentMessages.length]);

  // ── Scroll instantáneo al fondo al abrir una conversación ─────────────────
  useEffect(() => {
    if (!selectedUser) return;
    // requestAnimationFrame garantiza que el DOM ya tiene los mensajes pintados
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  }, [selectedUser]);

  // ── Mostrar botón de bajar cuando el usuario está scrolleado arriba ────────
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(distanceFromBottom > 200);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [selectedUser]); // re-bind cuando cambia la conversación

  // ── Al seleccionar usuario: marcar como leído + foco en input ─────────────
  useEffect(() => {
    if (!selectedUser) return;
    markMessagesAsRead(selectedUser);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [selectedUser]);

  // ── Marcar como leído cuando llega mensaje nuevo del usuario activo ────────
  useEffect(() => {
    if (!selectedUser || !currentUsername) return;
    const last = currentMessages[currentMessages.length - 1];
    if (last && last.from === selectedUser && !last.read) {
      markMessagesAsRead(selectedUser);
    }
  }, [currentMessages.length]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !selectedUser || !currentUsername || sending) return;

    setSending(true);
    try {
      const ok = await sendMessage(selectedUser, trimmed);
      if (ok) {
        setInputMessage('');
        // Scroll al fondo inmediatamente tras enviar
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      } else {
        toast.error('Error al enviar. Revisa la consola.');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSending(false);
    }
  }, [inputMessage, selectedUser, sending, sendMessage, currentUsername]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Formateo de fechas y horas ─────────────────────────────────────────────
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDateLabel = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
      const date  = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString())     return 'Hoy';
      if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    } catch { return ''; }
  };

  // ── Agrupar mensajes por fecha ─────────────────────────────────────────────
  const groupedMessages = useMemo(() => {
    const groups: { dateKey: string; label: string; msgs: Message[] }[] = [];
    const map = new Map<string, { label: string; msgs: Message[] }>();

    currentMessages.forEach(msg => {
      let dateKey = 'unknown';
      let label   = 'Fecha desconocida';
      try {
        const date = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
        dateKey    = date.toDateString();
        label      = formatDateLabel(msg.timestamp);
      } catch {}

      if (!map.has(dateKey)) {
        map.set(dateKey, { label, msgs: [] });
      }
      map.get(dateKey)!.msgs.push(msg as Message);
    });

    // Ordenar grupos por fecha
    const sorted = Array.from(map.entries())
      .filter(([k]) => k !== 'unknown')
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

    if (map.has('unknown')) sorted.push(['unknown', map.get('unknown')!]);

    sorted.forEach(([dateKey, val]) =>
      groups.push({ dateKey, label: val.label, msgs: val.msgs })
    );

    return groups;
  }, [currentMessages]);

  if (!user) return null;

  return (
    <div className="bg-slate-50 flex overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className={`
        ${showSidebar ? 'flex' : 'hidden'} md:flex
        w-full md:w-80 bg-white border-r border-slate-200 flex-col
        h-full overflow-hidden
      `}>
        {/* Header sidebar */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{user.username}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  En línea
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {totalUnreadCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-700 font-medium">
                {totalUnreadCount} mensaje{totalUnreadCount > 1 ? 's' : ''} nuevo{totalUnreadCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Lista de usuarios — div con overflow, no ScrollArea */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
            Contactos ({allUsers.length})
          </p>

          {allUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay otros usuarios</p>
            </div>
          ) : (
            allUsers.map((u) => {
              const unread     = getUnreadCountFromUser(u.username);
              const isOnline   = isUserOnline(u.username);
              const isSelected = selectedUser === u.username;

              return (
                <button
                  key={u.username}
                  onClick={() => {
                    setSelectedUser(u.username);
                    setShowSidebar(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200'}>
                        {u.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.username}</p>
                    <p className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isOnline ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-full flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Área de chat ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedUser ? (
          <>
            {/* Header chat */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowSidebar(true)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-slate-200">
                    {selectedUser.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                  isUserOnline(selectedUser) ? 'bg-green-500' : 'bg-slate-300'
                }`} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{selectedUser}</p>
                <p className="text-xs text-slate-500">
                  {isUserOnline(selectedUser) ? 'En línea' : 'Desconectado'}
                </p>
              </div>
            </div>

            {/* ── Mensajes: div con overflow-y-auto, NO ScrollArea ────────────
                ScrollArea de shadcn usa position:relative internamente y rompe
                el scroll cuando el contenedor padre tiene flex-1 + h-full.
                Con un div normal el scroll funciona perfectamente. */}
            <div className="flex-1 relative overflow-hidden">
              <div
                ref={messagesContainerRef}
                className="h-full overflow-y-auto p-4 space-y-6"
                style={{ overflowAnchor: 'none' }}
              >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay mensajes</p>
                  <p className="text-xs mt-1">Envía el primer mensaje</p>
                </div>
              ) : (
                groupedMessages.map(({ dateKey, label, msgs }) => (
                  <div key={dateKey}>
                    {/* Separador de fecha */}
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-slate-500 bg-slate-200 px-4 py-1.5 rounded-full font-medium">
                        {label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {msgs.map((msg) => {
                        const isMe = msg.from === currentUsername;

                        return (
                          <div
                            key={msg.id}
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-[75%]">
                              {/* Si es GIF/sticker: sin burbuja, solo la imagen */}
                              {msg.content.startsWith('https://') && msg.content.includes('.gif') ? (
                                <img
                                  src={msg.content}
                                  alt="gif"
                                  className="rounded-2xl max-w-[200px] max-h-[180px] object-contain"
                                />
                              ) : (
                                <div className={`px-4 py-2.5 rounded-2xl ${
                                  isMe
                                    ? 'bg-slate-900 text-white rounded-br-md'
                                    : 'bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-200'
                                }`}>
                                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                </div>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-slate-400">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {isMe && (
                                  msg.read
                                    ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    : <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              </div>

              {/* Botón flotante para bajar al fondo — solo visible cuando estás arriba */}
              {showScrollButton && (
                <button
                  onClick={() => {
                    if (messagesContainerRef.current) {
                      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                    }
                  }}
                  className="absolute bottom-4 right-4 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ background: 'rgba(15, 25, 48, 0.33)', backdropFilter: 'blur(6px)', color: 'white' }}
                  onMouseDown={e => (e.currentTarget.style.background = 'rgba(14, 19, 31, 0.75)')}
                  onMouseUp={e => (e.currentTarget.style.background = 'rgba(15, 15, 58, 0.47)')}
                  aria-label="Ir al último mensaje"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
              <div className="flex gap-2 max-w-4xl mx-auto relative">

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={emoji => {
                      setInputMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}

                {/* GIF Picker */}
                {showGifPicker && (
                  <GifPicker
                    onSelect={async gifUrl => {
                      setShowGifPicker(false);
                      if (!selectedUser || !currentUsername) return;
                      await sendMessage(selectedUser, gifUrl);
                    }}
                    onClose={() => setShowGifPicker(false)}
                  />
                )}

                {/* Botón emoji */}
                <button
                  type="button"
                  onClick={() => { setShowEmojiPicker(p => !p); setShowGifPicker(false); }}
                  className="h-12 w-12 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Botón GIF */}
                <button
                  type="button"
                  onClick={() => { setShowGifPicker(p => !p); setShowEmojiPicker(false); }}
                  className="h-12 w-12 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0"
                >
                  <Gift className="w-5 h-5" />
                </button>

                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  className="flex-1 h-12 border-slate-200 focus:border-slate-400"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || sending}
                  className="h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white flex-shrink-0"
                >
                  {sending ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Estado vacío — ningún usuario seleccionado */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-5">
              <MessageSquare className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">Selecciona un contacto</h3>
            <p className="text-sm text-center max-w-sm text-slate-500 mb-6">
              Elige a alguien de la lista para comenzar a chatear
            </p>
            <Button variant="outline" className="md:hidden" onClick={() => setShowSidebar(true)}>
              Ver contactos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}