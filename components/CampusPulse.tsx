'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, ViewMode, CampusPulseItem } from '@/types';
import { listNotices, listCommunities } from '@/lib/dbService';
import {
  FileText,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface CampusPulseProps {
  user: UserProfile;
  onSelectView?: (view: ViewMode) => void;
  onOpenPdfModal?: (fileName: string) => void;
  onOpenRsvpModal?: (title: string) => void;
}

export default function CampusPulse({
  user,
  onSelectView,
  onOpenPdfModal,
  onOpenRsvpModal,
}: CampusPulseProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [pulseItems, setPulseItems] = useState<CampusPulseItem[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadLivePulse() {
      try {
        const [notices, communities] = await Promise.all([
          listNotices(2),
          listCommunities(),
        ]);

        if (ignore) return;

        const items: CampusPulseItem[] = [];

        // 1. Top Notice from Firestore
        if (notices.length > 0) {
          const topNotice = notices[0];
          items.push({
            id: 'pulse-notice-1',
            type: 'notice',
            title: topNotice.title,
            metadata: `${topNotice.source} · ${topNotice.documentDate || 'Recent'}`,
            summary: topNotice.summaryBullets?.[0] || 'Official university circular directive.',
            actionLabel: 'View Circular',
            targetView: 'notices',
            targetData: topNotice.fileName,
            tagText: 'Official Directive',
          });
        }

        // 2. Upcoming Hands-on Workshop
        items.push({
          id: 'pulse-event-1',
          type: 'event',
          title: 'Autonomous Robotics & ROS2 Navigation Stack Workshop',
          metadata: 'Robotics Club · Tomorrow 4:00 PM',
          summary: 'Hands-on SLAM mapping, sensor fusion, and Nav2 stack configuration in Lab 402.',
          actionLabel: 'Reserve Seat',
          targetView: 'robotics-club',
          targetData: 'Autonomous Robotics & ROS2 Workshop',
          tagText: 'Lab Workshop',
        });

        // 3. Top Active Space
        if (communities.length > 0) {
          const topComm = communities[0];
          items.push({
            id: 'pulse-comm-1',
            type: 'community',
            title: `${topComm.name}: Active student collaboration`,
            metadata: `c/${topComm.slug} · ${topComm.memberCount} Members`,
            summary: topComm.description,
            actionLabel: 'Explore Space',
            targetView: topComm.slug.includes('robotics') ? 'robotics-club' : 'communities',
            targetData: topComm.slug,
            tagText: 'Community Spotlight',
          });
        }

        setPulseItems(items);
      } catch (err) {
        console.warn('Error loading live campus pulse from Firestore:', err);
      }
    }

    loadLivePulse();
    return () => {
      ignore = true;
    };
  }, []);

  const handlePulseAction = (item: CampusPulseItem) => {
    if (item.type === 'notice') {
      if (onOpenPdfModal && item.targetData) {
        onOpenPdfModal(item.targetData);
      } else if (onSelectView) {
        onSelectView(item.targetView);
      }
    } else if (item.type === 'event') {
      if (onOpenRsvpModal && item.targetData) {
        onOpenRsvpModal(item.targetData);
      } else if (onSelectView) {
        onSelectView(item.targetView);
      }
    } else if (item.type === 'community') {
      if (onSelectView) {
        onSelectView(item.targetView);
      }
    }
  };

  const handleCatchMeUp = () => {
    window.dispatchEvent(
      new CustomEvent('open-campus-ai', {
        detail: {
          prompt:
            'Give me a quick campus briefing for today: important notices, upcoming events, and active student discussions.',
        },
      })
    );
  };

  return (
    <section
      aria-label="Campus Pulse"
      className="surface-pulse rounded-2xl p-3.5 sm:p-5 transition-all duration-300 relative overflow-hidden group shadow-2xs border border-subtle"
    >
      {/* Top brand accent marker */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6848] via-[#F43F5E] to-[#6366F1]" />

      {/* Header Row */}
      <div className="flex items-center justify-between pb-2.5 border-b border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6848] ring-4 ring-[#FF6848]/20 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h2 className="font-brand text-base sm:text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span>Campus Pulse</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#FF6848] bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border">
                Live
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-muted font-medium truncate">
              {isMinimized
                ? 'Key updates: Exam Directives · Lab Workshops · Active Spaces'
                : 'Your campus, at a glance'}
            </p>
          </div>
        </div>

        {/* Minimize / Expand Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-expanded={!isMinimized}
            aria-label={isMinimized ? 'Expand Campus Pulse' : 'Minimize Campus Pulse'}
            title={isMinimized ? 'Expand briefing' : 'Minimize briefing'}
            className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-[#FF6848] bg-surface-muted hover:bg-brand-surface border border-subtle hover:border-brand-border px-2.5 py-1 rounded-lg transition-all cursor-pointer min-h-[32px]"
          >
            <span>{isMinimized ? 'Expand' : 'Minimize'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMinimized ? 'rotate-90' : '-rotate-90'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isMinimized && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-subtle pt-2">
            {pulseItems.map((item, index) => {
              let IconComponent = FileText;
              if (item.type === 'event') IconComponent = Calendar;
              if (item.type === 'community') IconComponent = Users;

              return (
                <div
                  key={item.id}
                  onClick={() => handlePulseAction(item)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePulseAction(item);
                    }
                  }}
                  className={`py-2.5 md:py-2 cursor-pointer group flex flex-col justify-between transition-colors hover:bg-surface-muted/60 rounded-xl ${
                    index === 0 ? 'md:pr-4' : index === 1 ? 'md:px-4' : 'md:pl-4'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-bold text-[#FF6848] flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{item.tagText}</span>
                      </span>
                      <span className="text-[11px] text-muted font-medium">
                        {item.metadata.split('·')[1]?.trim() || item.metadata}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-[#FF6848] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-secondary leading-relaxed line-clamp-2 font-medium">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-subtle flex items-center justify-between text-xs font-bold text-[#FF6848]">
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campus AI Trigger */}
          <div className="mt-3 pt-2.5 border-t border-subtle">
            <button
              type="button"
              onClick={handleCatchMeUp}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-surface-muted/70 hover:bg-brand-surface border border-subtle hover:border-[#FF6848]/40 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF6848]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#FF6848] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,104,72,0.3)] group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-primary group-hover:text-[#FF6848] transition-colors">
                    Catch me up with <span className="font-ai text-[#FF6848]">Campus AI</span>
                  </span>
                  <p className="text-[11px] text-muted truncate hidden sm:block font-medium">
                    Instant briefing on urgent notices, lab schedules, and community discussions
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#FF6848] group-hover:text-[#E95739]">
                <span>Brief Me</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
