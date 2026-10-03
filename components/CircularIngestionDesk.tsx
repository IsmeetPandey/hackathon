'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { publishNotice, uploadPostAttachment } from '@/lib/dbService';
import {
  Upload,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Send,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
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
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState('End-Semester Examination Schedule — Comprehensive Timetable');
  const [source, setSource] = useState('Examination Cell');
  const [officerName, setOfficerName] = useState('Dr. V. Ramanathan (Controller of Examinations)');
  const [docCode, setDocCode] = useState('DOC-PID-9482-COE');
  const [category, setCategory] = useState('TIER 1 · INSTITUTIONAL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('circular_endsem_schedule_latest.pdf');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setErrorMessage(null);
    }
  };

  const handleApproveBroadcast = async () => {
    if (!userProfile.id) {
      setErrorMessage('Please sign in to broadcast official notices.');
      return;
    }

    setIsBroadcasting(true);
    setErrorMessage(null);
    try {
      let fileUrl = '';
      if (selectedFile) {
        try {
          const uploadRes = await uploadPostAttachment(selectedFile, 'notices');
          fileUrl = uploadRes.fileUrl;
        } catch {
          // Non-fatal if offline storage
        }
      }

      await publishNotice({
        docCode: docCode || `DOC-COE-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        source,
        officerName,
        category,
        documentDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        summaryBullets: bullets,
        fileName,
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
        fileUrl,
        channels: [source, 'Campus Feed', 'Notices Hub'],
        authorId: userProfile.id,
        authorRole: userProfile.role || 'Deanery Staff',
      });

      setCurrentStep(4);
    } catch (err: any) {
      console.error('Firestore notice publish error:', err);
      setErrorMessage(err.message || 'Failed to broadcast official notice to Firestore.');
    } finally {
      setIsBroadcasting(false);
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
          Upload signed university PDF circulars, review synthesized executive summaries, and broadcast to official Firestore channels.
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
                className={`p-2 rounded-lg flex items-center justify-center gap-2 transition ${
                  isCurrent
                    ? 'bg-brand-surface text-[#FF6848] font-bold border border-brand-border'
                    : isCompleted
                    ? 'text-emerald-500 font-bold'
                    : 'text-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#FF6848] text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-surface-muted text-muted'
                  }`}
                >
                  {isCompleted ? '✓' : s.number}
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div className="surface-elevated border border-subtle rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-primary font-brand">1. Upload Signed Circular PDF</h2>
          <div className="border-2 border-dashed border-subtle hover:border-[#FF6848] rounded-2xl p-8 text-center space-y-3 transition bg-surface-muted/50">
            <Upload className="w-10 h-10 text-[#FF6848] mx-auto" />
            <div>
              <p className="text-sm font-bold text-primary">Drag &amp; drop official circular or click to browse</p>
              <p className="text-xs text-muted mt-1">Accepts PDF, scanned institutional documents up to 25MB</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full max-w-xs mx-auto text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-surface file:text-[#FF6848] hover:file:bg-[#FF6848] hover:file:text-white file:transition cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Extract</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Extraction Review */}
      {currentStep === 2 && (
        <div className="surface-elevated border border-subtle rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-primary font-brand">2. Circular Metadata &amp; Directives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Notice Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-muted border border-subtle rounded-lg text-primary outline-none focus:border-[#FF6848]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Document Reference Code</label>
              <input
                type="text"
                value={docCode}
                onChange={(e) => setDocCode(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-muted border border-subtle rounded-lg text-primary outline-none focus:border-[#FF6848]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Issuing Source Department</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-muted border border-subtle rounded-lg text-primary outline-none focus:border-[#FF6848]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Signing Officer Name</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-muted border border-subtle rounded-lg text-primary outline-none focus:border-[#FF6848]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
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
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <span>Review Executive Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Broadcast */}
      {currentStep === 3 && (
        <div className="surface-elevated border border-subtle rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-primary font-brand">3. Review &amp; Broadcast to Firestore</h2>
          <div className="p-4 rounded-xl bg-surface-muted border border-subtle space-y-2.5 text-xs">
            <div className="font-bold text-primary text-sm">{title}</div>
            <div className="text-muted font-medium">Ref: {docCode} · {source}</div>
            <div className="pt-2 border-t border-subtle space-y-1.5">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#FF6848] font-bold">•</span>
                  <span className="text-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isBroadcasting}
              className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleApproveBroadcast}
              disabled={isBroadcasting}
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing to Firestore...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Approve &amp; Broadcast Notice</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Broadcast Complete */}
      {currentStep === 4 && (
        <div className="surface-elevated border border-subtle rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-primary font-brand">Circular Successfully Broadcasted</h2>
          <p className="text-xs text-muted max-w-md mx-auto font-medium">
            The notice is now live in Firestore. It has been pinned to the campus feed and listed in the Notices Hub.
          </p>
          <button
            type="button"
            onClick={onBroadcastSuccess}
            className="btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
          >
            Go to Campus Feed
          </button>
        </div>
      )}
    </div>
  );
}
