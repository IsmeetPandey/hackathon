'use client';

import React, { useState } from 'react';
import { DEMO_NOTICES } from '@/lib/mockData';
import { CircularNoticeItem } from '@/types';
import { FileText, Search, Download, ExternalLink, Calendar, Building2, CheckCircle2 } from 'lucide-react';

interface OfficialNoticesViewProps {
  onOpenPdfModal: (fileName: string) => void;
}

// Additional high-yield institutional notices for rich discovery
const INITIAL_CAMPUS_NOTICES: CircularNoticeItem[] = [
  ...DEMO_NOTICES,
  {
    id: 'notice-dean-02',
    docCode: 'DOC-2024-ACAD-3108',
    title: 'Spring Semester Course Pre-Registration & Elective Ballot Guidelines',
    source: 'Office of the Dean of Academics',
    officerName: 'Prof. S. R. Mukherjee (Dean of Academic Affairs)',
    category: 'Academic',
    documentDate: 'November 20, 2024',
    summaryBullets: [
      'Pre-registration portal unlocks for 3rd and 4th-year cohorts on December 05, 2024 at 10:00 IST.',
      'Minimum credit requirement for graduation: Ensure completion of 18 Open Elective credits by end of Semester 7.',
      'Prerequisite validation: Automatic course prerequisite audits run nightly; faculty advisor approval is mandatory for course overloads.',
    ],
    fileName: 'academic_course_registration_2025.pdf',
    fileSize: '1.2 MB',
    publishedAt: '2024-11-20T08:00:00.000Z',
    status: 'broadcasted',
    targetAudience: 'All Enrolled Undergraduate Students',
    channels: ['Academic Portal', 'Email Digest'],
  },
  {
    id: 'notice-lib-03',
    docCode: 'DOC-2024-LIB-0914',
    title: 'Round-the-Clock Central Library Access & Finals Silent Reading Zones',
    source: 'Central Library Directorate',
    officerName: 'Dr. Neha Kapoor (Chief Librarian)',
    category: 'Facilities',
    documentDate: 'November 18, 2024',
    summaryBullets: [
      'Wings C and D will operate on a 24/7 continuous schedule starting Monday, November 25 through the completion of finals.',
      'Smart campus card tap entry is required after 22:00 IST. High-speed backup power and Wi-Fi maintained across all floors.',
      'Book return waiver: All late fines for textbook reserves are frozen during the active final examination period.',
    ],
    fileName: 'library_reading_rooms_guidelines.pdf',
    fileSize: '840 KB',
    publishedAt: '2024-11-18T10:30:00.000Z',
    status: 'broadcasted',
    targetAudience: 'Campus Community',
    channels: ['Library Notice Board', 'Campus Portal'],
  },
  {
    id: 'notice-cdc-04',
    docCode: 'DOC-2024-CDC-8812',
    title: 'Campus Career & Placement Cell: Phase-1 Interview Slot Allocations',
    source: 'Career Development Centre (CDC)',
    officerName: 'Prof. Anirudh K. (Director, Placements)',
    category: 'Placements',
    documentDate: 'November 15, 2024',
    summaryBullets: [
      'Day-1 technical interview rounds for core engineering and software firms initiate on December 01, 2024.',
      'Formal campus dress code and verified digital ID card with QR code authentication required for hall entry in Block B.',
      'Shortlisted students must complete preliminary resume locking on the CDC portal before the November 27 deadline.',
    ],
    fileName: 'placement_drive_schedule_phase1.pdf',
    fileSize: '1.8 MB',
    publishedAt: '2024-11-15T14:15:00.000Z',
    status: 'broadcasted',
    targetAudience: 'Graduating Batch 2025',
    channels: ['CDC Portal', 'Email Notice'],
  },
];

export default function OfficialNoticesView({ onOpenPdfModal }: OfficialNoticesViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Examinations', 'Academic', 'Facilities', 'Placements'];

  const filteredNotices = INITIAL_CAMPUS_NOTICES.filter((notice) => {
    const matchesCategory =
      activeCategory === 'All' ||
      notice.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
      (activeCategory === 'Examinations' && notice.title.toLowerCase().includes('exam'));

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      notice.title.toLowerCase().includes(query) ||
      notice.source.toLowerCase().includes(query) ||
      notice.docCode.toLowerCase().includes(query) ||
      notice.summaryBullets.some((b) => b.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title & Context */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#FF4500]">
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Institutional Communications</span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#111827] tracking-tight">
          Official Notices
        </h1>
        <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
          Authoritative circulars, academic schedules, and institutional announcements verified by campus administration.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#FF4500] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, codes, topics..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF4500] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-[#9CA3AF] mx-auto" />
            <h3 className="text-base font-semibold text-[#111827]">No notices found</h3>
            <p className="text-xs text-[#6B7280]">
              Try clearing your search query or selecting a different category.
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <article
              key={notice.id}
              className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-xl p-5 sm:p-6 shadow-xs transition space-y-4"
            >
              {/* Issuing Office & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FF4500]" />
                  <span className="font-semibold text-[#111827]">
                    {notice.source.replace('c/', '').replace('_', ' ')}
                  </span>
                  <span>·</span>
                  <span>{notice.officerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{notice.documentDate}</span>
                  <span className="text-[#9CA3AF]">·</span>
                  <span className="font-mono text-[11px] text-[#6B7280]">{notice.docCode}</span>
                </div>
              </div>

              {/* Notice Title */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#111827] leading-snug">
                  {notice.title}
                </h2>
              </div>

              {/* Summary Points */}
              <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg p-4 space-y-2">
                <span className="text-xs font-semibold text-[#4B5563] block mb-1">
                  Key Directives &amp; Summary:
                </span>
                <ul className="space-y-1.5 text-xs text-[#374151]">
                  {notice.summaryBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-[#FF4500] font-bold shrink-0 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <span className="text-xs text-[#6B7280]">
                  Target: <span className="font-medium text-[#374151]">{notice.targetAudience}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenPdfModal(notice.fileName || 'circular.pdf')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FFF4EE] border border-[#D1D5DB] hover:border-[#FF4500] text-[#111827] hover:text-[#FF4500] rounded-lg text-xs font-semibold transition active:scale-95 shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-[#FF4500]" />
                  <span>View Full Circular (PDF)</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
