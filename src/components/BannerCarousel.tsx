import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, ZoomIn, Volume2, VolumeX } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";
import VideoZoomModal from "@/components/VideoZoomModal";

interface BannerSlide {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  youtube_id: string | null;
  type: string;
  link_type: string;
  link_url: string | null;
  sort_order: number | null;
}

interface BannerCarouselProps {
  square?: boolean;
}

const BannerCarousel = ({ square = false }: BannerCarouselProps) => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ src: string; title?: string | null; description?: string | null } | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ title?: string | null; description?: string | null } | null>(null);
  const [muted, setMuted] = useState(true);
  const [needsManualPlay, setNeedsManualPlay] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlides = async () => {
      const { data } = await supabase
        .from("banner_slides")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) setSlides(data);
    };
    fetchSlides();
  }, []);

  const currentSlide = slides[current];
  const isMp4Current = currentSlide?.type === "mp4" && !!currentSlide?.video_url;

  // Auto-advance only when not playing video and current isn't an mp4
  useEffect(() => {
    if (slides.length <= 1 || playingVideo || isMp4Current) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, playingVideo, isMp4Current]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([slideId, video]) => {
      if (!video) return;
      if (slideId !== currentSlide?.id) {
        video.pause();
        video.currentTime = 0;
      }
    });

    if (!isMp4Current || !currentSlide?.id) {
      setNeedsManualPlay(null);
      return;
    }

    const video = videoRefs.current[currentSlide.id];
    if (!video) return;

    video.muted = muted;
    video.playsInline = true;
    video.play()
      .then(() => setNeedsManualPlay(null))
      .catch(() => setNeedsManualPlay(currentSlide.id));
  }, [current, currentSlide?.id, isMp4Current, muted]);

  const playCurrentMp4 = useCallback((slideId: string) => {
    const video = videoRefs.current[slideId];
    if (!video) return;
    video.muted = muted;
    video.play()
      .then(() => setNeedsManualPlay(null))
      .catch(() => setNeedsManualPlay(slideId));
  }, [muted]);

  const handleClick = useCallback((slide: BannerSlide) => {
    if (slide.type === "video" && slide.youtube_id) {
      setPlayingVideo(slide.youtube_id);
      setVideoMeta({ title: slide.title, description: slide.description });
      return;
    }
    if (slide.type === "mp4") {
      // mp4 plays inline; click follows configured link if any
      if (slide.link_type === "internal" && slide.link_url) navigate(slide.link_url);
      else if (slide.link_type === "external" && slide.link_url) window.open(slide.link_url, "_blank");
      return;
    }
    if (slide.link_type === "internal" && slide.link_url) {
      navigate(slide.link_url);
    } else if (slide.link_type === "external" && slide.link_url) {
      window.open(slide.link_url, "_blank");
    } else if (slide.type === "image" && slide.image_url) {
      // No link configured: open zoom view
      setZoomImage({ src: slide.image_url, title: slide.title, description: slide.description });
    }
  }, [navigate]);

  // Fallback static slides when no DB slides exist
  if (slides.length === 0) {
    const fallback = [
      { id: "1", title: "Bem-vindo ao App", gradient: "from-primary/80 to-amber-700/80", subtitle: "Sua plataforma completa de treinamentos" },
      { id: "2", title: "Novos Conteúdos", gradient: "from-red-600/80 to-red-900/80", subtitle: "Confira os treinamentos disponíveis" },
      { id: "3", title: "Acompanhe seu Progresso", gradient: "from-emerald-600/80 to-emerald-900/80", subtitle: "Evolua na sua jornada de aprendizado" },
    ];
    return (
      <FallbackCarousel slides={fallback} current={current} setCurrent={setCurrent} square={square} />
    );
  }

  return (
    <>
    <div className={`relative w-full h-full overflow-hidden rounded-xl bg-black ${square ? "aspect-square" : "aspect-video sm:aspect-[16/9] max-h-[420px]"}`}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          onClick={() => handleClick(slide)}
          className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {slide.type === "image" && slide.image_url ? (
            <>
              <img
                src={slide.image_url}
                alt={slide.title || "Banner"}
                className="w-full h-full object-contain select-none"
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setZoomImage({ src: slide.image_url!, title: slide.title, description: slide.description }); }}
                aria-label="Ampliar imagem"
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          ) : slide.type === "video" && slide.youtube_id ? (
            <div className="w-full h-full relative">
              <img
                src={`https://img.youtube.com/vi/${slide.youtube_id}/hqdefault.jpg`}
                alt={slide.title || "Vídeo"}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-foreground fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ) : slide.type === "mp4" && slide.video_url ? (
            <div className="w-full h-full relative">
              <video
                ref={(node) => { videoRefs.current[slide.id] = node; }}
                src={slide.video_url}
                className="w-full h-full object-contain"
                autoPlay={i === current}
                loop
                muted={muted}
                playsInline
                preload="auto"
              />
              {needsManualPlay === slide.id && i === current && (
                <button
                  onClick={(e) => { e.stopPropagation(); playCurrentMp4(slide.id); }}
                  aria-label="Reproduzir vídeo"
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/30"
                >
                  <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="w-7 h-7 text-foreground fill-current ml-1" />
                  </span>
                </button>
              )}
              {i === current && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-amber-700/80" />
          )}

          {/* Title + description overlay */}
          {(slide.title || slide.description) && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 pr-12">
              {slide.title && (
                <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-lg leading-tight line-clamp-1">
                  {slide.title}
                </h2>
              )}
              {slide.description && (
                <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 leading-snug line-clamp-2 drop-shadow">
                  {slide.description}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Arrows */}
      {slides.length > 1 && !playingVideo && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((prev) => (prev - 1 + slides.length) % slides.length); }}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((prev) => (prev + 1) % slides.length); }}
            aria-label="Próximo slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-white w-5" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

    </div>
    {zoomImage && (
      <ImageZoomModal
        src={zoomImage.src}
        title={zoomImage.title}
        description={zoomImage.description}
        onClose={() => setZoomImage(null)}
      />
    )}
    {playingVideo && (
      <VideoZoomModal
        youtubeId={playingVideo}
        title={videoMeta?.title}
        description={videoMeta?.description}
        onClose={() => { setPlayingVideo(null); setVideoMeta(null); }}
      />
    )}
    </>
  );
};

// Fallback when no slides in DB
const FallbackCarousel = ({ slides, current, setCurrent, square = false }: {
  slides: { id: string; title: string; gradient: string; subtitle: string }[];
  current: number;
  setCurrent: (n: number) => void;
  square?: boolean;
}) => (
  <div className={`relative w-full h-full overflow-hidden rounded-xl ${square ? "aspect-square" : "aspect-video sm:aspect-[16/9] max-h-[420px]"}`}>
    {slides.map((slide, i) => (
      <div
        key={slide.id}
        className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-br ${slide.gradient} flex flex-col justify-end p-5 ${
          i === current ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-xl font-extrabold text-white drop-shadow-lg">{slide.title}</h2>
        <p className="text-sm text-white/80 mt-1">{slide.subtitle}</p>
      </div>
    ))}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrent(i)}
          className={`w-2 h-2 rounded-full transition-all ${
            i === current ? "bg-white w-5" : "bg-white/40"
          }`}
        />
      ))}
    </div>
  </div>
);

export default BannerCarousel;
