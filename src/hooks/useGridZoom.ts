import { useEffect, useState } from "react";

const STORAGE_KEY = "mv:grid-zoom";
export const ZOOM_LEVELS = [1, 1.15, 1.3, 1.5] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const isZoom = (n: number): n is ZoomLevel =>
  (ZOOM_LEVELS as readonly number[]).includes(n);

export const useGridZoom = () => {
  const [zoom, setZoomState] = useState<ZoomLevel>(1);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseFloat(raw) : 1;
    if (isZoom(n)) setZoomState(n);
  }, []);

  const setZoom = (z: ZoomLevel) => {
    setZoomState(z);
    localStorage.setItem(STORAGE_KEY, String(z));
  };

  const cycle = (dir: 1 | -1) => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    const next = ZOOM_LEVELS[Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir))];
    setZoom(next);
  };

  return { zoom, setZoom, increase: () => cycle(1), decrease: () => cycle(-1), reset: () => setZoom(1) };
};