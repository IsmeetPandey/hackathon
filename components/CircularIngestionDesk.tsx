'use client';

import React, { useState } from 'react';
import { COURSE_IMPACT_DATA } from '@/lib/mockData';
import {
  Upload,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface CircularIngestionDeskProps {
  onOpenPdfModal: (fileName: string) => void;
  onSelectSubreddit?: (sub: string) => void;
  onSelectSpace?: (space: string) => void;
  onBroadcastSuccess: () => void;
}

export default function CircularIngestionDesk({
  onOpenPdfModal,
  onBroadcastSuccess,
}: CircularIngestionDeskProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('circular_endsem_schedule_latest.pdf');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const [bullets, setBullets] = useState([
    'Examination Windows: B.Tech End-Semester written examinations commence on schedule across all campus blocks.',
    'Strict Hall Ticket Deadline: Digital hall ticket download portal locks this Friday at 23:59 IST.',
    'Slot Shift Schedule: Morning session runs 09:30 - 12:30 (reporting 09:00); Afternoon session runs 14:00 - 17:00 (reporting 13:30).',
    'Calculator Policy: Only non-programmable models permitted for core courses.',
  ]);

  const steps = [
    { number: 1, label: 'Upload' },
    { number: 2, label: 'Extract' },
    { number: 3, label: 'Review' },
    { number: 4, label: 'Broadcast' },
  ];

  const handleApproveBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docCode: 'DOC-PID-9482-COE',
          title: 'End-Semester Examination Schedule — Comprehensive Timetable',
          source: 'Examination Cell',
          officerName: 'Dr. V. Ramanathan (Controller of Examinations)',
          category: 'Official Notice',
          documentDate: 'Published recently',
          summaryBullets: bullets,
          fileName: fileName,
          fileSize: '2.4 MB (14 Pages)',
          channels: ['Examination Cell', 'Campus Feed', 'Student Push'],
        }),
      });
    } catch (err) {
      console.warn('Backend broadcast error:', err);
    } finally {
      setIsBroadcasting(false);
      setCurrentStep(4);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Workspace Header */}
      <div className="surface-elevated text-primary rounded-2xl p-5 sm:p-6 border border-subtle shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FF6848] mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Campus Administration Console</span>
        </div>
        <h1 className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-primary">
          Publish Official Notice
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1 max-w-xl leading-relaxed font-medium">
          Upload signed university PDF circulars, review synthesized executive summaries, and broadcast to official channels.
        </p>
      </div>

      {/* 4-Step Stepper */}
      <div className="surface-elevated border border-subtle rounded-xl p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center">
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <div
                key={s.number}
                onClick={() => {
                  if (s.number <= currentStep) setCurrentStep(s.number);
                }}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg cursor-pointer transition font-bold ${
                  isCurrent
                    ? 'bg-brand-surface text-[#FF6848]'
                    : isCompleted
                    ? 'text-emerald-500 hover:bg-surface-muted'
                    : 'text-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition ${
                    isCurrent
                      ? 'bg-[#FF6848] text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-surface-muted text-muted border border-subtle'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Area */}
      <div className="surface-elevated border border-subtle rounded-xl shadow-2xs overflow-hidden">
        {/* STEP 1: Upload */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-10 text-center space-y-5 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto text-[#FF6848]">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="font-brand text-base sm:text-lg font-bold text-primary">Upload Administrative Circular (PDF)</h2>
              <p className="text-xs text-muted font-medium">
                Select an institutional timetable, calendar, or administrative directive PDF.
              </p>
            </div>

            <div className="p-5 border-2 border-dashed border-subtle hover:border-[#FF6848] rounded-xl transition bg-surface-muted space-y-2 cursor-pointer">
              <FileText className="w-7 h-7 text-muted mx-auto" />
              <div className="text-xs text-secondary font-bold">
                Drag and drop PDF here, or click to browse
              </div>
              <div className="text-[11px] text-muted font-medium">
                Maximum file size 25MB
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setFileName('circular_endsem_schedule_2025.pdf');
                  setCurrentStep(2);
                }}
                className="btn-primary w-full py-2.5 text-xs font-bold shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Process Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Extract */}
        {currentStep === 2 && (
          <div className="p-5 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#FF6848]" />
                <div>
                  <h2 className="font-brand text-sm sm:text-base font-bold text-primary">{fileName}</h2>
                  <p className="text-xs text-muted font-medium">2.4 MB · 14 Pages · Extracted via OCR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenPdfModal(fileName)}
                className="btn-secondary px-3 py-1.5 text-xs font-bold transition cursor-pointer"
              >
                Inspect PDF
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4 text-[#FF6848]" />
                <span className="font-ai">Extracted Key Points:</span>
              </div>
              <div className="bg-surface-muted border border-subtle rounded-xl p-4 space-y-2">
                {bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-secondary font-medium">
                    <span className="text-[#FF6848] font-bold shrink-0 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-subtle">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {currentStep === 3 && (
          <div className="p-5 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Document Details + Editable bullets */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 bg-surface-muted border border-subtle rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted">DOCUMENT DETAILS</span>
                    <span className="font-mono text-[10px] text-muted font-bold">DOC-PID-9482-COE</span>
                  </div>
                  <h3 className="font-brand text-sm sm:text-base font-bold text-primary">
                    End-Semester Examination Schedule — Autumn 2024
                  </h3>
                  <div className="text-xs text-muted font-medium">
                    Controller of Examinations · Dr. V. Ramanathan
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary">
                    Review &amp; Edit Key Bullet Points:
                  </label>
                  <div className="space-y-2">
                    {bullets.map((b, i) => (
                      <textarea
                        key={i}
                        rows={2}
                        value={b}
                        onChange={(e) => {
                          const updated = [...bullets];
                          updated[i] = e.target.value;
                          setBullets(updated);
                        }}
                        className="w-full p-2.5 text-xs border border-subtle rounded-lg bg-surface outline-none focus:border-[#FF6848] text-primary font-medium"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Broadcast configuration */}
              <div className="lg:col-span-5 bg-surface-muted border border-subtle rounded-xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-brand">
                  Broadcast Channels
                </h4>

                <div className="space-y-2 text-xs text-secondary font-medium">
                  <div className="flex justify-between py-1 border-b border-subtle">
                    <span>Audience</span>
                    <span className="font-bold text-primary">All Enrolled Students</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-subtle">
                    <span>Destinations</span>
                    <span className="font-bold text-primary">Notices Hub, Campus Feed</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-subtle">
                    <span>Verification</span>
                    <span className="font-bold text-emerald-500">PGP Key Verified</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApproveBroadcast}
                    disabled={isBroadcasting}
                    className="btn-primary w-full py-2.5 text-xs font-bold shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isBroadcasting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Broadcasting Notice...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Approve &amp; Broadcast Notice</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-muted text-center mt-2 font-medium">
                    Notice will appear immediately in student Official Notices and Campus Feed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-subtle">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Broadcast Confirmation */}
        {currentStep === 4 && (
          <div className="p-8 sm:p-12 text-center space-y-5 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="font-brand text-lg font-bold text-primary">Broadcast Published</h2>
              <p className="text-xs text-muted font-medium">
                The administrative circular is now live across student notice boards and campus feeds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => onBroadcastSuccess()}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                Return to Campus Feed
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                Ingest Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Technical Details (Cleanly collapsed by default) */}
      <div className="border border-subtle rounded-xl overflow-hidden surface-elevated shadow-2xs">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-4 py-3 bg-surface-muted hover:bg-surface flex items-center justify-between text-xs font-bold text-secondary transition cursor-pointer"
        >
          <span>Technical Distribution &amp; Audit Logs</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="p-4 space-y-4 border-t border-subtle text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-secondary font-medium">
              <div className="p-3 bg-surface-muted rounded-lg border border-subtle">
                <div className="font-bold text-primary mb-1">PGP Digest &amp; Audit Code</div>
                <div className="font-mono text-[11px] text-muted break-all font-bold">
                  SHA256: 8fa9c21b99482f01ac87eb419c82
                </div>
              </div>
              <div className="p-3 bg-surface-muted rounded-lg border border-subtle">
                <div className="font-bold text-primary mb-1">Distribution Matrix</div>
                <div className="text-[11px] text-muted font-medium">
                  4,280 Student Inboxes · Push Notification Synced
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-primary mb-2">Impacted Course Cohorts:</div>
              <div className="border border-subtle rounded-lg overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-muted border-b border-subtle text-[11px] text-muted font-bold">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Cohort</th>
                      <th className="p-2">Exam Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle text-xs font-medium">
                    {COURSE_IMPACT_DATA.map((row) => (
                      <tr key={row.code} className="hover:bg-surface-muted">
                        <td className="p-2 font-mono font-bold text-primary">{row.code}</td>
                        <td className="p-2 text-secondary">{row.title}</td>
                        <td className="p-2 text-muted">{row.cohort}</td>
                        <td className="p-2 text-muted">{row.examDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
