import React, { useEffect, useLayoutEffect, useRef } from 'react';
import defaultHeroImg from '@/assets/images/hepna-construction-hero.webp';
import './ScrollExpand.css';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  scrollHint?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = defaultHeroImg,
  mediaType = 'image',
  poster = '',
  alt = 'HEPNA MART Construction Materials',
  eyebrow = 'HEPNA MART',
  title = 'Great Buildings Begin With Great Foundations',
  subtitle,
  scrollHint = 'Scroll to build',
  children,
  className = '',
  style,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const applyProgress = (progress: number) => {
    const frame = frameRef.current;
    if (!frame) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const startW = isMobile ? 86 : 56;
    const startH = isMobile ? 70 : 62;
    const startR = isMobile ? 16 : 24;

    const e = smoothstep(0, 1, progress);

    const w = startW + (100 - startW) * e;
    const h = startH + (100 - startH) * e;
    const r = Math.max(0, startR * (1 - e));

    frame.style.width = `${w}%`;
    frame.style.height = `${h}%`;
    frame.style.borderRadius = `${r}px`;

    if (imgRef.current) {
      const scale = 1.05 - 0.05 * e;
      imgRef.current.style.transform = `scale(${scale})`;
    }

    if (scrimRef.current) {
      const scrimOp = 0.22 + 0.26 * e;
      scrimRef.current.style.opacity = `${scrimOp}`;
    }

    if (titleRef.current) {
      const titleFade = smoothstep(0.22, 0.65, progress);
      titleRef.current.style.opacity = `${1 - titleFade}`;
      titleRef.current.style.transform = `translate3d(0, ${-30 * titleFade}px, 0)`;
      titleRef.current.style.pointerEvents = titleFade > 0.8 ? 'none' : 'auto';
    }

    if (overlayRef.current) {
      const overlayIn = smoothstep(0.60, 0.95, progress);
      overlayRef.current.style.opacity = `${overlayIn}`;
      overlayRef.current.style.transform = `translate3d(0, ${20 * (1 - overlayIn)}px, 0)`;
      overlayRef.current.style.pointerEvents = overlayIn > 0.6 ? 'auto' : 'none';
    }
  };

  useLayoutEffect(() => {
    applyProgress(0);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      applyProgress(1);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (trackRef.current && stickyRef.current) {
          const rect = trackRef.current.getBoundingClientRect();
          const stageH = stickyRef.current.clientHeight || (window.innerWidth < 768 ? window.innerHeight * 0.72 : window.innerHeight * 0.82);
          const totalTrackH = trackRef.current.clientHeight;
          const scrollableDistance = Math.max(1, totalTrackH - stageH);

          // rect.top goes from 0 (track hits top of window) to -scrollableDistance
          const progress = clamp(-rect.top / scrollableDistance, 0, 1);
          applyProgress(progress);
        }
        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <section className={`scroll-expand-section ${className}`.trim()} style={style}>
      <div ref={trackRef} className="scroll-expand-track">
        <div ref={stickyRef} className="scroll-expand-sticky">
          {/* Centered expanding media frame */}
          <div
            ref={frameRef}
            className="scroll-expand-frame"
            style={{
              width: '56%',
              height: '62%',
              borderRadius: '24px',
            }}
          >
            {mediaType === 'video' ? (
              <video
                className="scroll-expand-media"
                src={src}
                poster={poster}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                ref={imgRef}
                className="scroll-expand-media"
                src={src}
                alt={alt}
                loading="eager"
                decoding="sync"
                draggable={false}
              />
            )}

            {/* Subtle atmospheric scrim */}
            <div ref={scrimRef} className="scroll-expand-scrim" />

            {/* Initial Headline Layer */}
            <div ref={titleRef} className="scroll-expand-title-layer">
              {eyebrow && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-3 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs sm:text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>{eyebrow}</span>
                </div>
              )}
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white leading-[1.15] tracking-tight max-w-3xl drop-shadow-2xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-200 font-normal max-w-xl drop-shadow-md">
                  {subtitle}
                </p>
              )}
              {scrollHint && (
                <div className="scroll-expand-hint mt-6">
                  <span>{scrollHint}</span>
                  <span className="animate-bounce text-accent text-base">↓</span>
                </div>
              )}
            </div>

            {/* Revealed Overlay Layer at 100% Expansion */}
            {children && (
              <div ref={overlayRef} className="scroll-expand-overlay-layer">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollExpand;
