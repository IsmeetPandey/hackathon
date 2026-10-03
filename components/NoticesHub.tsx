'use client';

import React, { useState, useEffect } from 'react';
import { CircularNoticeItem, ViewMode } from '@/types';
import { DEMO_NOTICES, COURSE_IMPACT_DATA } from '@/lib/mockData';
import {
  FileText,
  Download,
  ShieldCheck,
  Search,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NoticesHubProps {
  onOpenPdfModal: (fileName: string) => void;
  onSelectView?: (view: ViewMode) => void;
}

export default function NoticesHub({ onOpenPdfModal, onSelectView }: NoticesHubProps) {
  const [notices, setNotices] = useState<CircularNoticeItem[]>(DEMO_NOTICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'examination' | 'academic' | 'placement'>('all');
  const [activeTab, setActiveTab] = useState<'notices' | 'clash_schedule'>('notices');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadNotices() {
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data.notices) && data.notices.length > 0) {
            setNotices(data.notices);
          }
        }
      } catch (err) {
        console.warn('Could not fetch /api/notices, using fallback:', err);
      }
    }
    loadNotices();
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
      <div className="surface-elevated rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Official Notices
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5 max-w-2xl leading-relaxed">
              Digitally verified university circulars, academic notices, and examination directives.
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

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`filter-segment text-xs sm:text-sm ${
              activeTab === 'notices' ? 'filter-segment-active' : ''
            }`}
          >
            All Circulars ({notices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clash_schedule')}
            className={`filter-segment text-xs sm:text-sm flex items-center gap-1.5 ${
              activeTab === 'clash_schedule' ? 'filter-segment-active' : ''
            }`}
          >
            <span>Course Exam Matrix</span>
            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full bg-surface-muted text-secondary font-mono">
              8 courses
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'notices' ? (
        <>
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-surface-muted border border-subtle rounded-lg text-xs sm:text-sm text-primary placeholder:text-muted focus:outline-hidden focus:border-[#FF6848] focus:bg-surface transition"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 bg-surface-muted p-1 rounded-xl border border-subtle">
              {[
                { id: 'all', label: 'All' },
                { id: 'examination', label: 'Exams' },
                { id: 'academic', label: 'Academics' },
                { id: 'placement', label: 'Placements' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`filter-segment ${
                    selectedCategory === tab.id ? 'filter-segment-active' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notices List: Mobile-first Scannable Hierarchy */}
          <div className="space-y-3">
            {filteredNotices.map((notice) => {
              const isExpanded = expandedNoticeId === notice.id;

              return (
                <article
                  key={notice.id}
                  className="surface-elevated rounded-2xl p-3.5 sm:p-5 transition"
                >
                  {/* Top Bar: Office + Date */}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-primary truncate">
                        {notice.source.replace('c/', '').replace('_', ' ')}
                      </span>
                      <span>·</span>
                      <span>{notice.documentDate || 'Recent'}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted shrink-0">
                      {notice.docCode}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
                    {notice.title}
                  </h2>

                  {/* 1-2 Most Important Summary Lines by default */}
                  {notice.summaryBullets && notice.summaryBullets.length > 0 && (
                    <div className="mt-2.5 space-y-1 text-xs sm:text-sm text-secondary">
                      {(isExpanded ? notice.summaryBullets : notice.summaryBullets.slice(0, 2)).map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#FF6848] font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions & Progressive Disclosure */}
                  <div className="mt-3 pt-2.5 border-t border-subtle flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenPdfModal(notice.fileName || 'circular_endsem_schedule_latest.pdf')}
                        className="btn-primary min-h-[38px] px-3.5 text-xs font-semibold shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Notice</span>
                      </button>

                      {notice.summaryBullets && notice.summaryBullets.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                          className="btn-tertiary text-xs"
                        >
                          <span>{isExpanded ? 'Less' : 'Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <span className="text-muted bg-surface-muted px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border border-subtle">
                      Verified Circular
                    </span>
                  </div>
                </article>
              );
            })}

            {filteredNotices.length === 0 && (
              <div className="surface-elevated rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
                <h3 className="font-semibold text-xs sm:text-sm text-primary">No notices found</h3>
                <p className="text-xs text-muted mt-0.5">Try searching for different terms.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Course Exam Matrix */
        <div className="surface-elevated rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-subtle">
            <h2 className="font-brand font-bold text-primary text-sm sm:text-base">Autumn End-Semester Timetable Matrix</h2>
            <p className="text-xs text-muted mt-0.5 font-medium">
              Verified examination dates across departments. Cross-reference for timetable clash resolution.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-surface-muted border-b border-subtle text-muted text-xs font-bold">
                  <th className="py-2.5 px-3 font-bold">Course Code</th>
                  <th className="py-2.5 px-3 font-bold">Subject Title</th>
                  <th className="py-2.5 px-3 font-bold">Cohort</th>
                  <th className="py-2.5 px-3 font-bold">Exam Slot</th>
                  <th className="py-2.5 px-3 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {COURSE_IMPACT_DATA.map((c) => (
                  <tr key={c.code} className="hover:bg-surface-muted transition font-medium">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{c.code}</td>
                    <td className="py-2.5 px-3 text-primary font-semibold">{c.title}</td>
                    <td className="py-2.5 px-3 text-secondary">{c.degreeSem}</td>
                    <td className="py-2.5 px-3 font-bold text-[#FF6848]">{c.examDate}</td>
                    <td className="py-2.5 px-3 text-muted">{c.cohort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
