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
  // Default un-expanded as requested to keep the feed clean and prioritized
  const [isMinimized, setIsMinimized] = useState(true);
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
      className={`surface-pulse rounded-2xl transition-all duration-200 relative overflow-hidden group shadow-2xs border border-subtle ${
        isMinimized ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'
      }`}
    >
      {/* Top brand accent marker */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6848] via-[#F43F5E] to-[#6366F1]" />

      {/* Header Row */}
      <div className={`flex items-center justify-between ${isMinimized ? '' : 'pb-2 border-b border-subtle'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#FF6848] ring-4 ring-[#FF6848]/20 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h2 className="font-brand text-sm sm:text-base font-bold text-primary tracking-tight flex items-center gap-1.5">
              <span>Campus Pulse</span>
              <span className="text-[10px] font-bold text-[#FF6848] bg-brand-surface px-1.5 py-0.5 rounded-full border border-brand-border">
                Live
              </span>
            </h2>
            <p className="text-[11px] text-muted font-medium truncate">
              {isMinimized
                ? 'Exam Directives · Lab Workshops · Active Spaces'
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
            className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-[#FF6848] bg-surface-muted hover:bg-brand-surface border border-subtle hover:border-brand-border px-2.5 py-1 rounded-lg transition-all cursor-pointer min-h-[30px]"
          >
            <span>{isMinimized ? 'Expand' : 'Collapse'}</span>
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
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-subtle pt-1">
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
                  className={`py-1.5 md:py-1 cursor-pointer group flex flex-col justify-between transition-colors hover:bg-surface-muted/60 rounded-xl ${
                    index === 0 ? 'md:pr-3' : index === 1 ? 'md:px-3' : 'md:pl-3'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span className="font-bold text-[#FF6848] flex items-center gap-1">
                        <IconComponent className="w-3 h-3" />
                        <span>{item.tagText}</span>
                      </span>
                      <span className="text-[10px] text-muted font-medium">
                        {item.metadata.split('·')[1]?.trim() || item.metadata}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-primary group-hover:text-[#FF6848] transition-colors leading-snug line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-[11px] text-secondary leading-snug line-clamp-1 font-medium">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-1 pt-1 border-t border-subtle flex items-center justify-between text-[11px] font-bold text-[#FF6848]">
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campus AI Trigger */}
          <div className="mt-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={handleCatchMeUp}
              className="w-full min-h-[36px] px-3 py-1.5 rounded-xl bg-surface-muted/70 hover:bg-brand-surface border border-subtle hover:border-[#FF6848]/40 text-left transition-all flex items-center justify-between gap-2.5 group cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF6848]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#FF6848] text-white flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(255,104,72,0.3)] group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-primary group-hover:text-[#FF6848] transition-colors">
                    Brief me with <span className="font-ai text-[#FF6848]">Campus AI</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#FF6848] group-hover:text-[#E95739]">
                <span>Brief Me</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
