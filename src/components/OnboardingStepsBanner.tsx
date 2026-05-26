import { useEffect, useState } from "react";
import { X } from "lucide-react";
import onboardingImage from "@/assets/onboarding-steps-banner.png";

const STORAGE_KEY = "onboarding_steps_banner_seen_v1";
const AUTO_DISMISS_MS = 10_000;

const OnboardingStepsBanner = () => {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(pct);
    }, 100);
    const timeout = window.setTimeout(() => close(), AUTO_DISMISS_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto max-h-[92vh]">
          <img
            src={onboardingImage}
            alt="Passo a passo do novo Mapa de Vendas"
            className="w-full h-auto block"
          />
        </div>

        {/* Progress bar dos 10 segundos */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStepsBanner;