import React, { useState, useEffect } from 'react';

export const ScrollProgress: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    /* 
      Vertical scroll animation flowing from TOP to BOTTOM on the right screen edge
    */
    <div className="fixed top-0 right-0 h-full w-[5px] z-50 bg-slate-200/60 pointer-events-none">
      <div
        className="w-full bg-gradient-to-b from-urbanic-orange via-amber-500 to-urbanic-orange transition-all duration-150 ease-out shadow-[-2px_0_10px_rgba(242,101,34,0.6)] rounded-b-full"
        style={{ height: `${scrollProgress}%` }}
      />
    </div>
  );
};
