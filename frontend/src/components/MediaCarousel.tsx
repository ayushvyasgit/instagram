'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface MediaCarouselProps {
  mediaUrls: string[];
  onDoubleTap: () => void;
  showHeartAnimation: boolean;
}

const isVideoUrl = (url: string): boolean => {
  const videoExts = ['.mp4', '.mpeg', '.mov', '.webm'];
  const lower = url.toLowerCase().split('?')[0];
  return videoExts.some(ext => lower.endsWith(ext));
};

export default function MediaCarousel({ mediaUrls, onDoubleTap, showHeartAnimation }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragLocked = useRef(false);
  const wasDragging = useRef(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const isMulti = mediaUrls.length > 1;

  // --- Navigation ---
  const goTo = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setDragOffset(0);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 450);
  }, [currentIndex, isTransitioning]);

  const goToNext = useCallback(() => {
    if (currentIndex < mediaUrls.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, mediaUrls.length, goTo]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // --- Touch/Swipe ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchStartTime.current = Date.now();
    isDragLocked.current = false;
    wasDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    if (!isMulti) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;

    if (!isDragLocked.current) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (Math.abs(dx) > Math.abs(dy)) {
          isDragLocked.current = true;
          setIsDragging(true);
          wasDragging.current = true;
        } else {
          return;
        }
      }
      return;
    }

    e.preventDefault();
    let offset = dx;
    if ((currentIndex === 0 && offset > 0) || (currentIndex === mediaUrls.length - 1 && offset < 0)) {
      offset *= 0.3;
    }
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragLocked.current) return;
    const w = containerRef.current?.offsetWidth || 300;
    const velocity = Math.abs(dragOffset) / (Date.now() - touchStartTime.current);
    const threshold = w * 0.25;

    if (dragOffset < -threshold || (dragOffset < -20 && velocity > 0.4)) {
      goToNext();
    } else if (dragOffset > threshold || (dragOffset > 20 && velocity > 0.4)) {
      goToPrev();
    } else {
      setDragOffset(0);
    }
    setIsDragging(false);
    isDragLocked.current = false;
  };

  // --- Mouse drag (desktop) ---
  const mouseDown = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning || !isMulti) return;
    mouseDown.current = true;
    touchStartX.current = e.clientX;
    touchStartTime.current = Date.now();
    isDragLocked.current = false;
    wasDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown.current || isTransitioning) return;
    const dx = e.clientX - touchStartX.current;

    if (!isDragLocked.current && Math.abs(dx) > 5) {
      isDragLocked.current = true;
      setIsDragging(true);
      wasDragging.current = true;
    }
    if (!isDragLocked.current) return;

    let offset = dx;
    if ((currentIndex === 0 && offset > 0) || (currentIndex === mediaUrls.length - 1 && offset < 0)) {
      offset *= 0.3;
    }
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!mouseDown.current) return;
    mouseDown.current = false;
    if (!isDragLocked.current) return;

    const w = containerRef.current?.offsetWidth || 300;
    const velocity = Math.abs(dragOffset) / (Date.now() - touchStartTime.current);
    const threshold = w * 0.25;

    if (dragOffset < -threshold || (dragOffset < -20 && velocity > 0.4)) {
      goToNext();
    } else if (dragOffset > threshold || (dragOffset > 20 && velocity > 0.4)) {
      goToPrev();
    } else {
      setDragOffset(0);
    }
    setIsDragging(false);
    isDragLocked.current = false;
  };

  const handleMouseLeave = () => {
    if (mouseDown.current) {
      mouseDown.current = false;
      setDragOffset(0);
      setIsDragging(false);
      isDragLocked.current = false;
    }
  };

  // --- Click (double-tap coexistence) ---
  const handleClick = () => {
    if (!wasDragging.current) {
      onDoubleTap();
    }
    wasDragging.current = false;
  };

  // --- Video auto-play/pause ---
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === currentIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex]);

  // --- IntersectionObserver for video pause on scroll ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          videoRefs.current.forEach(v => v?.pause());
        } else {
          const cur = videoRefs.current[currentIndex];
          cur?.play().catch(() => {});
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentIndex]);

  // --- Keyboard nav ---
  useEffect(() => {
    if (!isMulti) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToNext, goToPrev, isMulti]);

  const renderMedia = (url: string, index: number) => {
    if (isVideoUrl(url)) {
      return (
        <video
          ref={el => { videoRefs.current[index] = el; }}
          src={url}
          className="mc-media"
          playsInline
          muted
          loop
          preload="metadata"
        />
      );
    }
    return (
      <Image
        src={url}
        alt=""
        fill
        className="mc-media"
        unoptimized
        priority={index === currentIndex}
        draggable={false}
      />
    );
  };

  return (
    <>
      <style>{`
        .mc-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #0a0a0a;
          overflow: hidden;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .mc-container:active { cursor: grabbing; }
        .mc-container.mc-single { cursor: pointer; }

        /* ── Stack depth cards (behind active) ── */
        .mc-stack-card {
          position: absolute;
          inset: 0;
          border-radius: 0;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          pointer-events: none;
        }
        .mc-stack-1 {
          transform: scale(0.96) translateY(6px);
          opacity: 0.45;
          filter: blur(1px);
          z-index: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .mc-stack-2 {
          transform: scale(0.92) translateY(12px);
          opacity: 0.25;
          filter: blur(2px);
          z-index: -1;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        }

        /* ── Slides track ── */
        .mc-track {
          position: absolute;
          inset: 0;
          display: flex;
          z-index: 2;
        }
        .mc-track.mc-animated {
          transition: transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .mc-slide {
          position: relative;
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .mc-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }

        /* ── Glass glare overlay ── */
        .mc-glare {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.015) 30%,
            transparent 55%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 3;
        }

        /* ── Chevron buttons ── */
        .mc-chevron {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.12);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 6;
          opacity: 0;
          transition: opacity 0.2s ease, background 0.2s ease, transform 0.2s ease;
          padding: 0;
        }
        .mc-container:hover .mc-chevron { opacity: 1; }
        .mc-chevron:hover {
          background: rgba(0,0,0,0.75);
          transform: translateY(-50%) scale(1.08);
        }
        .mc-chevron:active { transform: translateY(-50%) scale(0.95); }
        .mc-chevron-left { left: 8px; }
        .mc-chevron-right { right: 8px; }

        @media (hover: none) {
          .mc-chevron { opacity: 0.85; }
        }

        /* ── Dot indicators ── */
        .mc-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          z-index: 6;
          padding: 4px 8px;
          border-radius: 10px;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .mc-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.25s ease, transform 0.25s ease, width 0.25s ease;
        }
        .mc-dot-active {
          background: #ffffff;
          transform: scale(1.35);
          box-shadow: 0 0 6px rgba(255,255,255,0.4);
        }
        .mc-dot:hover:not(.mc-dot-active) {
          background: rgba(255,255,255,0.6);
        }

        /* ── Heart animation overlay ── */
        .mc-heart-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
        }
        .mc-heart-svg {
          animation: mc-heart-pop 0.9s ease-out forwards;
          filter: drop-shadow(0 0 12px rgba(255,255,255,0.4));
        }
        @keyframes mc-heart-pop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(0.95); opacity: 1; }
          45% { transform: scale(1.05); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }

        /* ── Counter badge (e.g., 2/5) ── */
        .mc-counter {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          z-index: 6;
          letter-spacing: 0.5px;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .mc-chevron { width: 26px; height: 26px; }
          .mc-dot { width: 5px; height: 5px; }
          .mc-dot-active { transform: scale(1.4); }
          .mc-stack-1 { transform: scale(0.97) translateY(4px); }
          .mc-stack-2 { transform: scale(0.94) translateY(8px); }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`mc-container ${!isMulti ? 'mc-single' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Stack depth cards */}
        {isMulti && currentIndex < mediaUrls.length - 1 && (
          <div className="mc-stack-card mc-stack-1" />
        )}
        {isMulti && currentIndex < mediaUrls.length - 2 && (
          <div className="mc-stack-card mc-stack-2" />
        )}

        {/* Slides track */}
        <div
          className={`mc-track ${!isDragging ? 'mc-animated' : ''}`}
          style={{
            transform: `translateX(calc(${-currentIndex * 100}% + ${isDragging ? dragOffset : 0}px))`,
          }}
        >
          {mediaUrls.map((url, i) => (
            <div key={i} className="mc-slide">
              {renderMedia(url, i)}
            </div>
          ))}
        </div>

        {/* Glass glare */}
        <div className="mc-glare" />

        {/* Counter badge */}
        {isMulti && (
          <div className="mc-counter">{currentIndex + 1} / {mediaUrls.length}</div>
        )}

        {/* Chevrons */}
        {isMulti && currentIndex > 0 && (
          <button
            className="mc-chevron mc-chevron-left"
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            aria-label="Previous image"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {isMulti && currentIndex < mediaUrls.length - 1 && (
          <button
            className="mc-chevron mc-chevron-right"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            aria-label="Next image"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Dot indicators */}
        {isMulti && (
          <div className="mc-dots">
            {mediaUrls.map((_, i) => (
              <button
                key={i}
                className={`mc-dot ${i === currentIndex ? 'mc-dot-active' : ''}`}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Heart animation */}
        {showHeartAnimation && (
          <div className="mc-heart-overlay">
            <svg className="mc-heart-svg" fill="white" height="80" viewBox="0 0 48 48" width="80">
              <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"/>
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
