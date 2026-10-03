'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SEARCH_ARCHIVE_MATCHES, DEMO_COMMUNITIES, DEMO_NOTICES } from '@/lib/mockData';
import { Search, X, Users, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchResultsOverlayProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (destination: string) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'Community' | 'Notice' | 'Post';
  target: string;
}

function cleanCommunityName(name: string): string {
  if (name.toLowerCase().includes('robotics')) return 'Robotics Club';
  if (name.toLowerCase().includes('exam')) return 'Examination Cell';
  if (name.toLowerCase().includes('placement')) return 'Career & Placements';
  if (name.toLowerCase().includes('coding')) return 'Coding & Algorithms';
  if (name.toLowerCase().includes('ieee')) return 'IEEE Student Branch';
  if (name.toLowerCase().includes('hackathon')) return 'Hackathon Commons';
  return name.replace('c/', '').replace('_', ' ');
}

export default function SearchResultsOverlay({
  query,
  isOpen,
  onClose,
  onSelectResult,
}: SearchResultsOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.trim().toLowerCase();

  // 1. Filter Communities (max 3)
  const matchedCommunities = DEMO_COMMUNITIES.filter(
    (c) =>
      !cleanQuery ||
      cleanCommunityName(c.name).toLowerCase().includes(cleanQuery) ||
      c.title.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  // 2. Filter Notices (max 3)
  const matchedNotices = DEMO_NOTICES.filter(
    (n) =>
      !cleanQuery ||
      n.title.toLowerCase().includes(cleanQuery) ||
      n.source.toLowerCase().includes(cleanQuery) ||
      n.docCode.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  // 3. Filter Posts (max 4)
  const matchedPosts = SEARCH_ARCHIVE_MATCHES.filter(
    (p) =>
      !cleanQuery ||
      p.title.toLowerCase().includes(cleanQuery) ||
      p.community.toLowerCase().includes(cleanQuery)
  ).slice(0, 4);

  // Flattened items for linear keyboard navigation
  const flatItems: SearchItem[] = useMemo(() => [
    ...matchedCommunities.map((c) => ({
      id: `comm-${c.id}`,
      title: cleanCommunityName(c.name),
      subtitle: `${c.memberCount.toLocaleString()} members · ${c.category === 'official' ? 'Official' : 'Club'}`,
      type: 'Community' as const,
      target: c.slug.includes('robotics') || c.name.toLowerCase().includes('robotics') ? 'robotics-club' : `community:${c.slug}`,
    })),
    ...matchedNotices.map((n) => ({
      id: `notice-${n.id}`,
      title: n.title,
      subtitle: `${n.source.replace('c/', '').replace('_', ' ')} · ${n.documentDate}`,
      type: 'Notice' as const,
      target: `notice:${n.fileName || 'circular_endsem_schedule_latest.pdf'}`,
    })),
    ...matchedPosts.map((p) => ({
      id: `post-${p.id}`,
      title: p.title,
      subtitle: `${cleanCommunityName(p.community)} · ${p.upvotes} upvotes`,
      type: 'Post' as const,
      target: p.community.includes('Robotics') ? 'robotics-club' : 'all-campus',
    })),
  ], [matchedCommunities, matchedNotices, matchedPosts]);

  // Adjust selected index on query change
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Handle keyboard events (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          onSelectResult(flatItems[selectedIndex].target);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-start pt-14 sm:pt-20 px-0 sm:px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="w-full sm:max-w-[680px] bg-white/98 backdrop-blur-md border-b sm:border border-[#E5E7EB] sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] overflow-hidden flex flex-col h-[calc(100dvh-3.5rem)] sm:h-auto sm:max-h-[75vh] animate-in fade-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Search className="w-4 h-4 text-[#FF4500]" />
            <span>
              {query ? (
                <>
                  Results for &ldquo;<span className="font-semibold text-[#111827]">{query}</span>&rdquo;
                </>
              ) : (
                'Search campus, notices, and spaces'
              )}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="text-[#6B7280] hover:text-[#111827] min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              No matches found for &ldquo;{query}&rdquo;. Try searching for &ldquo;robotics&rdquo;, &ldquo;exam&rdquo;, or &ldquo;hackathon&rdquo;.
            </div>
          ) : (
            <>
              {/* 1. COMMUNITIES */}
              {matchedCommunities.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#6B7280] px-2 mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Communities</span>
                  </div>
                  <div className="space-y-1">
                    {matchedCommunities.map((c) => {
                      const itemIdx = flatItems.findIndex((fi) => fi.id === `comm-${c.id}`);
                      const isSelected = selectedIndex === itemIdx;
                      const displayName = cleanCommunityName(c.name);

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelectResult(c.slug.includes('robotics') || c.name.toLowerCase().includes('robotics') ? 'robotics-club' : `community:${c.slug}`);
                            onClose();
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition min-h-[48px] ${
                            isSelected ? 'bg-[#FFF4EE] text-[#111827]' : 'hover:bg-[#F9FAFB] active:bg-[#F3F4F6]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#FF4500]/10 text-[#FF4500] font-bold text-xs flex items-center justify-center shrink-0">
                              {displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[#111827] truncate">
                                {displayName}
                              </div>
                              <div className="text-xs text-[#6B7280] truncate">
                                {c.memberCount.toLocaleString()} members · {c.category === 'official' ? 'Official' : 'Club'}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. NOTICES */}
              {matchedNotices.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#6B7280] px-2 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Official Notices</span>
                  </div>
                  <div className="space-y-1">
                    {matchedNotices.map((n) => {
                      const itemIdx = flatItems.findIndex((fi) => fi.id === `notice-${n.id}`);
                      const isSelected = selectedIndex === itemIdx;

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            onSelectResult(`notice:${n.fileName || 'circular_endsem_schedule_latest.pdf'}`);
                            onClose();
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition min-h-[48px] ${
                            isSelected ? 'bg-[#FFF4EE] text-[#111827]' : 'hover:bg-[#F9FAFB] active:bg-[#F3F4F6]'
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-sm font-semibold text-[#111827] truncate">
                              {n.title}
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {n.source.replace('c/', '').replace('_', ' ')} · {n.documentDate}
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-[#FF4500] shrink-0">
                            Notice
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. POSTS */}
              {matchedPosts.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#6B7280] px-2 mb-1 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Discussions</span>
                  </div>
                  <div className="space-y-1">
                    {matchedPosts.map((p) => {
                      const itemIdx = flatItems.findIndex((fi) => fi.id === `post-${p.id}`);
                      const isSelected = selectedIndex === itemIdx;

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectResult(p.community.includes('Robotics') ? 'robotics-club' : 'all-campus');
                            onClose();
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition min-h-[48px] ${
                            isSelected ? 'bg-[#FFF4EE] text-[#111827]' : 'hover:bg-[#F9FAFB] active:bg-[#F3F4F6]'
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-sm font-semibold text-[#111827] truncate">
                              {p.title}
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {cleanCommunityName(p.community)} · {p.upvotes} upvotes
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hint (Desktop only) */}
        <div className="hidden sm:flex px-4 py-2 border-t border-[#F1F5F9] bg-[#F8FAFC] items-center justify-between text-[11px] text-[#9CA3AF] shrink-0">
          <span>Click any item to jump directly to content</span>
          <div className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            <span>Enter to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
