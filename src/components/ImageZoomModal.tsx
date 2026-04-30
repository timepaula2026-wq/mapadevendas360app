import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  title?: string | null;
  description?: string | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 8;

const ImageZoomModal = ({ src, title, description, onClose }: Props) => {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{
    dist: number;
    scale: number;
    tx: number;
    ty: number;
    // midpoint relative to stage center, in screen px (not scaled)
    mx: number;
    my: number;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);
  // Tracks the active touch interaction so we can decide if it ends as a
  // pure tap (close-on-outside) or as a gesture (pinch/pan — must NOT close).
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    moved: boolean;
    multiTouch: boolean;
    targetIsStage: boolean;
  } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Move focus into the modal on open and restore it on close (a11y)
  useEffect(() => {
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2))));
  }, []);

  // Helper: midpoint of two touches relative to the stage center
  const midpointRelToCenter = (t1: React.Touch, t2: React.Touch) => {
    const rect = stageRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    return {
      mx: (t1.clientX + t2.clientX) / 2 - cx,
      my: (t1.clientY + t2.clientY) / 2 - cy,
    };
  };

  // Touch handlers (pinch + pan + double-tap)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch in progress — disqualify this interaction from being a tap
      if (gestureRef.current) gestureRef.current.multiTouch = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const { mx, my } = midpointRelToCenter(e.touches[0], e.touches[1]);
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale,
        tx,
        ty,
        mx,
        my,
      };
    } else if (e.touches.length === 1) {
      gestureRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
        moved: false,
        multiTouch: false,
        targetIsStage: e.target === stageRef.current,
      };
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        // double tap toggle zoom
        if (scale > 1) reset();
        else setScale(2.5);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (gestureRef.current && e.touches.length >= 1) {
      const dx = e.touches[0].clientX - gestureRef.current.startX;
      const dy = e.touches[0].clientY - gestureRef.current.startY;
      if (Math.hypot(dx, dy) > 10) gestureRef.current.moved = true;
      if (e.touches.length > 1) gestureRef.current.multiTouch = true;
    }
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const start = pinchRef.current;
      const rawScale = start.scale * (dist / start.dist);
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));
      const ratio = next / start.scale;

      // Current midpoint (allows panning while pinching)
      const { mx, my } = midpointRelToCenter(e.touches[0], e.touches[1]);
      const panDx = mx - start.mx;
      const panDy = my - start.my;

      // Keep finger midpoint fixed while scaling, then add pan delta so
      // users can drag with the pinch gesture as well.
      const nextTx = mx - (start.mx - start.tx) * ratio + panDx;
      const nextTy = my - (start.my - start.ty) * ratio + panDy;
      setScale(next);
      setTx(nextTx);
      setTy(nextTy);
    } else if (e.touches.length === 1 && dragRef.current && scale > 1) {
      setTx(dragRef.current.tx + (e.touches[0].clientX - dragRef.current.x));
      setTy(dragRef.current.ty + (e.touches[0].clientY - dragRef.current.y));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    const ended = e.touches.length === 0;
    // Clean tap on the backdrop (no pinch, no pan, short).
    // If zoomed: reset to original size. If already at original: close.
    if (
      ended &&
      g &&
      g.targetIsStage &&
      !g.moved &&
      !g.multiTouch &&
      Date.now() - g.startTime < 300 &&
      !pinchRef.current
    ) {
      if (scale > 1) {
        reset();
      } else {
        onClose();
      }
    }
    if (ended) {
      dragRef.current = null;
      pinchRef.current = null;
      gestureRef.current = null;
    }
  };

  // Mouse drag when zoomed
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };
  const onMouseUp = () => { dragRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const mx = e.clientX - cx;
    const my = e.clientY - cy;
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2)));
      const ratio = next / s;
      setTx((t) => mx - (mx - t) * ratio);
      setTy((t) => my - (my - t) * ratio);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Visualização ampliada: ${title}` : "Visualização ampliada da imagem"}
      aria-describedby={description ? "image-zoom-description" : undefined}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between p-3 z-10"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); zoomBy(-0.5); }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); zoomBy(0.5); }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); reset(); }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span
            className="px-3 h-9 rounded-full bg-white/10 text-white text-xs flex items-center"
            role="status"
            aria-live="polite"
            aria-label={`Nível de zoom atual: ${Math.round(scale * 100)} por cento`}
          >
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Always-visible floating close button (respects iPhone notch/safe-area) */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
        className="fixed z-[120] flex items-center gap-2 pl-3 pr-4 h-12 rounded-full bg-red-600 ring-2 ring-white text-white font-semibold text-sm hover:bg-red-700 active:scale-95 transition shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          right: "calc(env(safe-area-inset-right, 0px) + 0.75rem)",
        }}
        aria-label="Fechar visualização ampliada da imagem"
        aria-keyshortcuts="Escape"
        title="Fechar (Esc)"
      >
        <X className="w-6 h-6" strokeWidth={3} />
        <span>Fechar</span>
      </button>

      {/* Image stage */}
      <div
        ref={stageRef}
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onClick={(e) => {
          // Mouse-only path. Touch close is handled in onTouchEnd to avoid
          // conflicting with pinch/pan gestures (synthetic clicks are ignored).
          if (e.target === e.currentTarget && e.detail > 0) {
            if (scale > 1) {
              reset();
            } else {
              onClose();
            }
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <img
          src={src}
          alt={title || description || "Imagem ampliada"}
          role="img"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[95vw] max-h-[90vh] object-contain"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: dragRef.current || pinchRef.current ? "none" : "transform 0.15s ease-out",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
        />
      </div>

      {/* Caption */}
      {(title || description) && (
        <div
          className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pt-8 pb-5 sm:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-3xl mx-auto">
            {title && (
              <h3 className="text-white font-semibold text-sm sm:text-base leading-tight drop-shadow">
                {title}
              </h3>
            )}
            {description && (
              <p id="image-zoom-description" className="text-white/85 text-xs sm:text-sm leading-relaxed mt-1 drop-shadow whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageZoomModal;