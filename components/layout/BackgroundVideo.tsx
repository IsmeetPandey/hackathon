'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Fluid metallic chrome canvas fallback if video is buffering or unsupported
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth / 2);
    let height = (canvas.height = window.innerHeight / 2);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth / 2;
      height = canvas.height = window.innerHeight / 2;
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    const render = () => {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Liquid metallic chrome ripples shader approximation
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.3, '#1E293B');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(0.7, '#1E293B');
      grad.addColorStop(1, '#080C16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Waves with specular chrome reflections
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const yOffset = height * (0.25 * i + 0.1);
        ctx.moveTo(0, yOffset);
        for (let x = 0; x < width; x += 15) {
          const wave =
            Math.sin(x * 0.008 + t + i * 1.2) * 25 +
            Math.cos(x * 0.015 - t * 0.8 + i) * 15;
          ctx.lineTo(x, yOffset + wave);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, yOffset - 30, width, yOffset + 60);
        waveGrad.addColorStop(0, 'rgba(203, 213, 225, 0.12)');
        waveGrad.addColorStop(0.5, 'rgba(51, 65, 85, 0.25)');
        waveGrad.addColorStop(1, 'rgba(15, 23, 42, 0.40)');
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="bg-video-container" aria-hidden="true">
      {/* 1. Fluid Canvas Metallic Fallback */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none filter blur-xs transition-opacity duration-700 ${
            videoLoaded && !videoError ? 'opacity-20' : 'opacity-60'
          }`}
        />
      )}

      {/* 2. Real Background Video Layer */}
      {!prefersReducedMotion && !videoError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={() => {
            setVideoLoaded(false);
            setVideoError(true);
          }}
          className={`bg-video-element transition-opacity duration-500 ${
            videoLoaded ? 'opacity-45 dark:opacity-35' : 'opacity-0'
          }`}
        >
          <source
            src="/videos/campus-background.mp4"
            type="video/mp4"
            onError={() => {
              setVideoLoaded(false);
              setVideoError(true);
            }}
          />
        </video>
      )}

      {/* 3. Soft Dark/Light Readability Overlay */}
      <div className="bg-readability-overlay" />
    </div>
  );
}
