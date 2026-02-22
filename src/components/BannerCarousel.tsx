import { useState, useEffect } from "react";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

const slides: BannerSlide[] = [
  {
    id: "1",
    title: "Bem-vindo ao App",
    subtitle: "Sua plataforma completa de treinamentos",
    gradient: "from-primary/80 to-amber-700/80",
  },
  {
    id: "2",
    title: "Novos Conteúdos",
    subtitle: "Confira os treinamentos disponíveis",
    gradient: "from-red-600/80 to-red-900/80",
  },
  {
    id: "3",
    title: "Acompanhe seu Progresso",
    subtitle: "Evolua na sua jornada de aprendizado",
    gradient: "from-emerald-600/80 to-emerald-900/80",
  },
];

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-[16/9] max-h-[200px]">
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

      {/* Dots */}
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
};

export default BannerCarousel;
