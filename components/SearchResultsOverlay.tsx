'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { listCommunities, listNotices, listPosts } from '@/lib/dbService';
import { Community, CircularNoticeItem, PostItem } from '@/types';
import { Search, X, Users, FileText, MessageSquare, ArrowRight, CornerDownLeft } from 'lucide-react';

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

export default function SearchResultsOverlay({
  query,
  isOpen,
  onClose,
  onSelectResult,
}: SearchResultsOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [notices, setNotices] = useState<CircularNoticeItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    async function fetchSearchPool() {
      try {
        const [cList, nList, pList] = await Promise.all([
          listCommunities(),
          listNotices(15),
          listPosts({ limitCount: 20 }),
        ]);
        if (!ignore) {
          setCommunities(cList);
          setNotices(nList);
          setPosts(pList);
        }
      } catch (err) {
        console.warn('Search pool load error:', err);
      }
    }
    fetchSearchPool();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  // Filter Communities
  const matchedCommunities = communities
    .filter(
      (c) =>
        !cleanQuery ||
        c.name.toLowerCase().includes(cleanQuery) ||
        c.title.toLowerCase().includes(cleanQuery) ||
        c.slug.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 3);

  // Filter Notices
  const matchedNotices = notices
    .filter(
      (n) =>
        !cleanQuery ||
        n.title.toLowerCase().includes(cleanQuery) ||
        n.source.toLowerCase().includes(cleanQuery) ||
        n.docCode.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 3);

  // Filter Posts
  const matchedPosts = posts
    .filter(
      (p) =>
        !cleanQuery ||
        p.title.toLowerCase().includes(cleanQuery) ||
        p.content.toLowerCase().includes(cleanQuery) ||
        p.community.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 4);

  // Flattened searchable items for keyboard navigation
  const flatItems: SearchItem[] = useMemo(() => [
    ...matchedCommunities.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.memberCount} members · c/${c.slug}`,
      type: 'Community' as const,
      target: `community:${c.slug}`,
    })),
    ...matchedNotices.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: `${n.docCode} · ${n.source}`,
      type: 'Notice' as const,
      target: `notice:${n.fileName || 'circular.pdf'}`,
    })),
    ...matchedPosts.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `${p.community} · by ${p.author}`,
      type: 'Post' as const,
      target: 'all-campus',
    })),
  ], [matchedCommunities, matchedNotices, matchedPosts]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          onSelectResult(flatItems[selectedIndex].target);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onSelectResult, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in duration-100"
        onClick={onClose}
      />

      {/* Overlay Modal */}
      <div
        ref={containerRef}
        className="fixed top-[64px] sm:top-[72px] left-1/2 -translate-x-1/2 w-[95%] sm:w-full sm:max-w-[620px] bg-surface-elevated border border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Indicator */}
        <div className="px-4 py-3 border-b border-subtle flex items-center justify-between text-xs text-muted bg-surface-muted/60">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#FF6848]" />
            <span className="font-semibold text-primary">
              {query ? `Results for "${query}"` : 'Quick Navigation'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-surface-muted rounded text-muted hover:text-primary transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[65vh] overflow-y-auto p-2 divide-y divide-subtle">
          {flatItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted space-y-1">
              <Search className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-primary">No results found on Firestore</p>
              <p>Try searching for exam notices, robotics, hackathons, or faculty posts.</p>
            </div>
          ) : (
            <>
              {/* Communities Section */}
              {matchedCommunities.length > 0 && (
                <div className="py-2 first:pt-0">
                  <div className="px-3 py-1 text-[11px] font-bold text-muted uppercase tracking-wider font-brand">
                    Spaces &amp; Clubs
                  </div>
                  <div className="space-y-0.5">
                    {matchedCommunities.map((c) => {
                      const itemIndex = flatItems.findIndex((fi) => fi.id === c.id);
                      const isSelected = selectedIndex === itemIndex;

                      return (
                        <div
                          key={c.id}
                          onClick={() => onSelectResult(`community:${c.slug}`)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? 'bg-brand-surface text-[#FF6848]'
                              : 'hover:bg-surface-muted text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-surface border border-subtle flex items-center justify-center text-xs font-bold shrink-0">
                              <Users className="w-3.5 h-3.5 text-[#FF6848]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold truncate">
                                {c.name}
                              </div>
                              <div className="text-[11px] text-muted truncate font-medium">
                                {c.memberCount} members · c/{c.slug}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notices Section */}
              {matchedNotices.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1 text-[11px] font-bold text-muted uppercase tracking-wider font-brand">
                    Official Notices
                  </div>
                  <div className="space-y-0.5">
                    {matchedNotices.map((n) => {
                      const itemIndex = flatItems.findIndex((fi) => fi.id === n.id);
                      const isSelected = selectedIndex === itemIndex;

                      return (
                        <div
                          key={n.id}
                          onClick={() => onSelectResult(`notice:${n.fileName || 'circular.pdf'}`)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? 'bg-brand-surface text-[#FF6848]'
                              : 'hover:bg-surface-muted text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-surface border border-subtle flex items-center justify-center text-xs font-bold shrink-0">
                              <FileText className="w-3.5 h-3.5 text-[#FF6848]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold truncate">
                                {n.title}
                              </div>
                              <div className="text-[11px] text-muted truncate font-medium">
                                {n.docCode} · {n.source}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-[#FF6848] bg-surface px-1.5 py-0.5 rounded border border-subtle shrink-0">
                            PDF
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts Section */}
              {matchedPosts.length > 0 && (
                <div className="py-2 last:pb-0">
                  <div className="px-3 py-1 text-[11px] font-bold text-muted uppercase tracking-wider font-brand">
                    Discussions &amp; Posts
                  </div>
                  <div className="space-y-0.5">
                    {matchedPosts.map((p) => {
                      const itemIndex = flatItems.findIndex((fi) => fi.id === p.id);
                      const isSelected = selectedIndex === itemIndex;

                      return (
                        <div
                          key={p.id}
                          onClick={() => onSelectResult('all-campus')}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? 'bg-brand-surface text-[#FF6848]'
                              : 'hover:bg-surface-muted text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-surface border border-subtle flex items-center justify-center text-xs font-bold shrink-0">
                              <MessageSquare className="w-3.5 h-3.5 text-[#FF6848]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold truncate">
                                {p.title}
                              </div>
                              <div className="text-[11px] text-muted truncate font-medium">
                                {p.community} · {p.upvotes} upvotes
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2 bg-surface-muted border-t border-subtle flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-[10px]">
              ↓
            </kbd>
            <span>Select:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-[10px] flex items-center gap-0.5">
              <CornerDownLeft className="w-2.5 h-2.5" /> Enter
            </kbd>
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-[10px]">
              ESC
            </kbd>
            <span className="ml-1">to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
