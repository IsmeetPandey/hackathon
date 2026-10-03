'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CircularNoticeItem, ViewMode } from '@/types';
import { listNotices } from '@/lib/dbService';
import {
  FileText,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface NoticesHubProps {
  onOpenPdfModal: (fileName: string) => void;
  onSelectView?: (view: ViewMode) => void;
}

export default function NoticesHub({ onOpenPdfModal, onSelectView }: NoticesHubProps) {
  const [notices, setNotices] = useState<CircularNoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'examination' | 'academic' | 'placement'>('all');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await listNotices(30);
        if (!ignore) setNotices(data);
      } catch (err) {
        console.error('Firestore notices fetch error:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredNotices = notices.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.docCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summaryBullets?.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'examination') return item.source.toLowerCase().includes('exam') || item.docCode.includes('COE');
    if (selectedCategory === 'academic') return item.source.toLowerCase().includes('dean') || item.source.toLowerCase().includes('academic');
    if (selectedCategory === 'placement') return item.source.toLowerCase().includes('place') || item.source.toLowerCase().includes('cdc');
    return true;
  });

  return (
    <div className="max-w-[1040px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header Banner */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-6 border border-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Official Notices
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5 max-w-2xl leading-relaxed">
              Digitally verified university circulars, academic notices, and examination directives stored on Firestore.
            </p>
          </div>

          {onSelectView && (
            <button
              type="button"
              onClick={() => onSelectView('ingestion-desk')}
              className="text-xs text-muted hover:text-primary transition flex items-center gap-1.5 self-start md:self-center shrink-0 cursor-pointer btn-tertiary"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-muted" />
              <span>Staff workspace</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mt-4 pt-3 border-t border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 bg-surface-muted p-1 rounded-xl border border-subtle">
            {[
              { id: 'all', label: `All (${notices.length})` },
              { id: 'examination', label: 'Examinations' },
              { id: 'academic', label: 'Academic Orders' },
              { id: 'placement', label: 'Placements' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`filter-segment text-xs ${
                  selectedCategory === cat.id ? 'filter-segment-active' : ''
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted hover:bg-surface border border-subtle rounded-lg text-primary placeholder:text-muted outline-none focus:border-[#FF6848] focus:bg-surface transition font-medium"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF6848]" />
          <span>Loading official notices from Firestore...</span>
        </div>
      )}

      {/* Notices Accordion Feed */}
      {!isLoading && (
        <div className="space-y-3.5">
          {filteredNotices.map((notice) => {
            const isExpanded = expandedNoticeId === notice.id;

            return (
              <div
                key={notice.id}
                className="surface-elevated rounded-2xl p-4 sm:p-5 transition border border-subtle space-y-3 shadow-2xs"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-mono font-bold text-[#FF6848] bg-brand-surface px-2 py-0.5 rounded border border-brand-border text-[11px]">
                        {notice.docCode}
                      </span>
                      <span className="text-muted font-medium">{notice.source}</span>
                      <span className="text-muted">·</span>
                      <span className="text-muted font-medium">{notice.documentDate}</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
                      {notice.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-muted transition shrink-0 cursor-pointer"
                    aria-label={isExpanded ? 'Collapse notice summary' : 'Expand notice summary'}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Summary Bullets */}
                <div className="space-y-1.5 text-xs sm:text-sm text-secondary leading-relaxed bg-surface-muted/60 p-3 rounded-xl border border-subtle font-medium">
                  {notice.summaryBullets.slice(0, isExpanded ? undefined : 2).map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#FF6848] font-bold mt-0.5">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                  {!isExpanded && notice.summaryBullets.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setExpandedNoticeId(notice.id)}
                      className="text-xs font-bold text-[#FF6848] hover:underline pt-1 block cursor-pointer"
                    >
                      + {notice.summaryBullets.length - 2} more key directives
                    </button>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-subtle text-xs">
                  <div className="flex items-center gap-2 text-muted font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Signed by {notice.officerName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPdfModal(notice.fileName || 'circular.pdf')}
                    className="px-3 py-1.5 rounded-xl bg-brand-surface hover:bg-[#FF6848] text-[#FF6848] hover:text-white border border-brand-border font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Circular PDF</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="surface-elevated rounded-2xl p-8 text-center space-y-2 border border-subtle">
              <FileText className="w-8 h-8 text-muted mx-auto mb-1" />
              <p className="text-sm font-bold text-primary">No circulars match your search</p>
              <p className="text-xs text-muted font-medium">
                Try clearing your search query or selecting &quot;All&quot; category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
