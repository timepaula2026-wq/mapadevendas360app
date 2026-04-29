import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  youtubeId: string;
  title?: string | null;
  description?: string | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const VideoZoomModal = ({ youtubeId, title, description, onClose }: Props) => {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reset = () => { setScale(1); setTx(0); setTy(0); };
  const zoomBy = (d: number) =>
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + d).toFixed(2))));

  // Pinch + pan on the wrapper (NOT the iframe — iframe captures its own touches)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale };
    } else if (e.touches.length === 1 && scale > 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchRef.current.scale * (dist / pinchRef.current.dist)),
      );
      setScale(next);
    } else if (e.touches.length === 1 && dragRef.current && scale > 1) {
      setTx(dragRef.current.tx + (e.touches[0].clientX - dragRef.current.x));
      setTy(dragRef.current.ty + (e.touches[0].clientY - dragRef.current.y));
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // only zoom on ctrl/cmd+wheel so page doesn't fight scroll
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
  };

  // Pin overlay shown ONLY while zoomed, so taps go to it (not the iframe) for pan/pinch.
  const zoomed = scale > 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between p-3 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2">
          <button
            onClick={() => zoomBy(-0.5)}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomBy(0.5)}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="px-3 h-9 rounded-full bg-white/10 text-white text-xs flex items-center">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative w-[95vw] h-[80vh] max-w-[1400px] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: dragRef.current || pinchRef.current ? "none" : "transform 0.15s ease-out",
          }}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Vídeo"
            className="w-full h-full rounded-xl bg-black"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />

          {/* Transparent overlay used ONLY when zoomed, so we can pan/pinch
              without YouTube intercepting touches. Hidden at scale=1 so controls are usable. */}
          {zoomed && (
            <div
              className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDoubleClick={reset}
            />
          )}
        </div>

        {/* When NOT zoomed, capture pinch on a thin edge area so users can still start a pinch */}
        {!zoomed && (
          <div
            className="absolute inset-0 pointer-events-none"
            // Listen at capture-less level only for multi-touch pinch start
            onTouchStart={(e) => { if (e.touches.length === 2) onTouchStart(e); }}
            onTouchMove={(e) => { if (e.touches.length === 2) onTouchMove(e); }}
            onTouchEnd={onTouchEnd}
            style={{ pointerEvents: "none" }}
          />
        )}
      </div>

      {zoomed && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs">
          Toque duplo para resetar • arraste para mover
        </p>
      )}

      {/* Caption */}
      {!zoomed && (title || description) && (
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
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed mt-1 drop-shadow whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoZoomModal;