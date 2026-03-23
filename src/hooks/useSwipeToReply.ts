// src/hooks/useSwipeToReply.ts
// Hook que detecta swipe horizontal hacia la derecha en un elemento
// y llama a onReply() cuando se supera el umbral — estilo WhatsApp.
// No modifica nada existente, solo se usa donde se quiera añadir el gesto.

import { useRef, useCallback } from 'react';

const THRESHOLD = 30;      // px mínimos para activar el reply
const MAX_DRAG = 30;      // px máximos de desplazamiento visual
const RESET_MS  = 300;     // ms de la animación de vuelta

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove:  (e: React.TouchEvent) => void;
  onTouchEnd:   () => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useSwipeToReply(onReply: () => void): SwipeHandlers {
  const elRef      = useRef<HTMLDivElement>(null);
  const startX     = useRef(0);
  const startY     = useRef(0);
  const dragging   = useRef(false);
  const fired      = useRef(false);       // evita disparar onReply más de una vez por gesto
  const isHoriz    = useRef<boolean | null>(null); // null = aún no decidido

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    dragging.current = true;
    fired.current    = false;
    isHoriz.current  = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Decidir dirección dominante la primera vez que el dedo se mueve
    if (isHoriz.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz.current = Math.abs(dx) > Math.abs(dy);
    }

    // Si el gesto es vertical, no interferir con el scroll
    if (!isHoriz.current) return;

    // Solo swipe hacia la DERECHA
    if (dx <= 0) {
      if (elRef.current) elRef.current.style.transform = '';
      return;
    }

    // Prevenir scroll mientras arrastramos horizontalmente
    e.preventDefault();

    const clamped = Math.min(dx, MAX_DRAG);
    if (elRef.current) {
      elRef.current.style.transition = 'none';
      elRef.current.style.transform  = `translateX(${clamped}px)`;
    }

    // Vibración haptica + disparo al superar umbral
    if (clamped >= THRESHOLD && !fired.current) {
      fired.current = true;
      if (navigator.vibrate) navigator.vibrate(30);
      onReply();
    }
  }, [onReply]);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    isHoriz.current  = null;
    if (!elRef.current) return;
    // Animación de vuelta al sitio
    elRef.current.style.transition = `transform ${RESET_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    elRef.current.style.transform  = 'translateX(0)';
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd, ref: elRef };
}