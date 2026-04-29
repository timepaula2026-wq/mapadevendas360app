import { Minus, Plus, Accessibility, RotateCcw } from "lucide-react";
import { useGridZoom, ZOOM_LEVELS } from "@/hooks/useGridZoom";

const GridZoomControl = () => {
  const { zoom, increase, decrease, reset } = useGridZoom();
  const idx = ZOOM_LEVELS.indexOf(zoom);
  const pct = Math.round(zoom * 100);

  return (
    <div
      role="group"
      aria-label="Acessibilidade: tamanho dos ícones"
      className="flex items-center gap-1.5 rounded-full bg-card/70 border border-border px-2 py-1 backdrop-blur"
    >
      <Accessibility className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
      <button
        type="button"
        onClick={decrease}
        disabled={idx === 0}
        aria-label="Diminuir tamanho dos ícones"
        className="w-6 h-6 flex items-center justify-center rounded-full text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-[10px] tabular-nums text-muted-foreground min-w-[2.5rem] text-center">
        {pct}%
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={idx === ZOOM_LEVELS.length - 1}
        aria-label="Aumentar tamanho dos ícones"
        className="w-6 h-6 flex items-center justify-center rounded-full text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      {zoom !== 1 && (
        <button
          type="button"
          onClick={reset}
          aria-label="Restaurar tamanho padrão"
          className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default GridZoomControl;