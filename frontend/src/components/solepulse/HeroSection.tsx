import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface HeroSectionProps {
  onExploreDashboard: () => void;
  onReadMore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreDashboard,
  onReadMore,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "RENEWABLE FLEET INTELLIGENCE",
      title: "PREDICTIVE MAINTENANCE PLATFORM",
      description:
        "Sole Pulse combines IoT telemetry with deep neural autoencoders to detect microscopic degradation in solar strings and wind turbines before catastrophic failure.",
      primaryAction: "Explore Fleet Dashboard",
      secondaryAction: "Read Tech Specs",
    },
    {
      badge: "SUB-SECOND FAULT DIAGNOSTICS",
      title: "PHYSICS-INFORMED ANOMALY DETECTION",
      description:
        "Trained on operational cycles with an anomaly reconstruction threshold of 1.033187, isolating overheating, soiling, and voltage collapses.",
      primaryAction: "Inspect Live Fleet",
      secondaryAction: "Company Story",
    },
    {
      badge: "FINANCIAL DOWNTIME PREVENTION",
      title: "SAVING ENERGY YIELD & REVENUE",
      description:
        "Translating complex sensor telemetry into actionable work orders sorted by daily dollar drag ($/day) and lost kilowatt-hours (kWh).",
      primaryAction: "View Maintenance Queue",
      secondaryAction: "Learn More",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full h-[460px] lg:h-[520px] overflow-hidden select-none bg-slate-900">
      {/* 
        HERO BACKGROUND: 
        Wind Turbine Windmill Sunset animated GIF from Pixabay
      */}
      <div className="absolute inset-0 z-0">
        <img
          src="/wind-turbine-sunset.gif"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://cdn.pixabay.com/animation/2023/03/17/02/19/02-19-19-487_512.gif";
          }}
          alt="Sole Pulse Wind Turbine Windmill Sunset Animation"
          className="w-full h-full object-cover object-center"
        />
        {/* Solid dark gradient overlay without muddy translucency */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Carousel Arrow Navigation (Left & Right arrows from template) */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-2 text-white bg-slate-900 hover:bg-black transition-all rounded-none border border-slate-700"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-2 text-white bg-slate-900 hover:bg-black transition-all rounded-none border border-slate-700"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Slide Content (Centered, sharp rectangular typography) */}
      <div className="relative z-10 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center px-6 lg:px-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-urbanic-orange text-white text-[11px] font-mono font-bold tracking-widest uppercase rounded-none">
          <Activity className="w-3.5 h-3.5" />
          <span>{slide.badge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight font-heading">
          {slide.title}
        </h1>

        <p className="mt-3 text-xs sm:text-sm lg:text-base text-slate-200 max-w-2xl leading-relaxed font-light">
          {slide.description}
        </p>

        {/* Orange Call To Action Button (Sharp 90-degree rectangular corners) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExploreDashboard}
            className="px-6 py-3 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white font-bold text-xs tracking-wider uppercase transition-all rounded-none shadow-none"
          >
            {slide.primaryAction}
          </button>

          <button
            onClick={onReadMore}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-600 font-semibold text-xs tracking-wider uppercase transition-all rounded-none"
          >
            {slide.secondaryAction}
          </button>
        </div>

        {/* Live System Stat Line */}
        <div className="mt-6 hidden sm:flex items-center gap-6 text-[11px] font-mono text-slate-300 bg-slate-900 px-4 py-1.5 border border-slate-700 rounded-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-none"></span>
            <span>100 Renewable Assets Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>Threshold: <strong className="text-amber-400">1.033187</strong></div>
          <span className="text-slate-600">|</span>
          <div>Accuracy: <strong className="text-emerald-400">95.27%</strong></div>
        </div>

        {/* Carousel Indicator Squares (Sharp Rectangular `▪ ▪ ▪`) */}
        <div className="absolute bottom-4 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-none transition-all ${
                currentSlide === idx
                  ? 'bg-urbanic-orange scale-110'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
