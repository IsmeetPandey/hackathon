'use client';

import React, { useRef, useState, useSyncExternalStore } from 'react';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  return (
    <div className="bg-video-container fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* 1. Real Background Video Layer */}
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
          className={`bg-video-element absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${
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

      {/* 2. Soft Dark/Light Readability Overlay */}
      <div className="bg-readability-overlay absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
