'use client';

import React from 'react';
import ModalShell from '@/components/ui/ModalShell';
import {
  FileText,
  Printer,
  Calendar,
  Bell,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface QuickModalsProps {
  modalType: string | null;
  modalData?: any;
  data?: any;
  onClose: () => void;
  showFeedbackToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export default function QuickModals({
  modalType,
  modalData,
  data,
  onClose,
  showFeedbackToast,
}: QuickModalsProps) {
  const [confirmedEventTitle, setConfirmedEventTitle] = React.useState<string | null>(null);

  if (!modalType) return null;
  const activeData = modalData !== undefined ? modalData : data;

  // 1. PDF VIEWER MODAL (Student-first: Question -> Action -> Verification)
  if (modalType === 'pdf') {
    return (
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title={modalData || 'Examination Schedule & Directives'}
        subtitle="Office of the Controller of Examinations · Verified University Circular"
        icon={
          <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center border border-brand-border">
            <FileText className="w-4 h-4" />
          </div>
        }
        maxWidth="2xl"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open-campus-ai', {
                      detail: {
                        prompt:
                          'Explain this official examination notice in simple terms and tell the student what action they need to take.',
                        contextTitle: 'Examination Notice · Autumn Semester',
                      },
                    })
                  );
                  onClose();
                }}
                className="px-3.5 py-2 bg-brand-surface hover:bg-brand-surface/80 text-[#FF6848] border border-brand-border rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 font-ai"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain this notice</span>
              </button>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary min-h-[38px] px-3.5 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showFeedbackToast) showFeedbackToast('Official PDF downloaded to your device', 'success');
                  onClose();
                }}
                className="btn-primary min-h-[38px] px-4 text-xs font-bold shadow-2xs"
              >
                Download PDF
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm text-primary">
          {/* Executive Directives */}
          <div className="border border-subtle rounded-xl p-4 sm:p-5 bg-surface-muted space-y-3 leading-relaxed shadow-2xs">
            <div className="border-b border-subtle pb-2">
              <h3 className="font-brand font-bold text-base text-primary">
                End-Semester Examination Directives
              </h3>
              <p className="text-xs text-muted mt-0.5 font-medium">
                Applicable to all undergraduate &amp; postgraduate degree candidates
              </p>
            </div>

            <div className="space-y-2.5 text-xs sm:text-[13px] text-secondary font-medium">
              <p>
                <strong className="text-primary">1. Key Timetable:</strong> Written examinations commence on schedule across all campus blocks. Students must check their registered course slots.
              </p>
              <p>
                <strong className="text-primary">2. Clash Resolution:</strong> If you have two enrolled subjects scheduled in the same shift, the conflict resolution form is accessible until <strong>this week at 23:59 IST</strong>.
              </p>
              <p>
                <strong className="text-primary">3. Hall Ticket Dispatch:</strong> Digital hall tickets with scannable barcode must be downloaded from the academic portal. Printed copy is required for hall entry.
              </p>
              <p>
                <strong className="text-primary">4. Session Timings:</strong> Morning session: 09:30–12:30 (reporting 09:00). Afternoon session: 14:00–17:00 (reporting 13:30).
              </p>
            </div>
          </div>

          {/* Subordinate Technical Verification Footer */}
          <div className="px-3.5 py-2.5 bg-surface border border-subtle rounded-lg flex items-center justify-between text-xs text-muted">
            <div>
              <span className="font-medium">Reference:</span>{' '}
              <span className="font-mono text-primary font-bold">DOC-PID-9482-COE</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Institutional Digital Seal Verified</span>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  // 2. RSVP MODAL (Two-step flow: Register -> Confirmed)
  if (modalType === 'rsvp') {
    const currentEvent = modalData || 'Autonomous Robotics & ROS2 Workshop';
    const isConfirmed = confirmedEventTitle === currentEvent;

    const handleClose = () => {
      setConfirmedEventTitle(null);
      onClose();
    };

    return (
      <ModalShell
        isOpen={true}
        onClose={handleClose}
        title={isConfirmed ? 'Registration Confirmed' : 'Register for Event'}
        subtitle={currentEvent}
        icon={
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isConfirmed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-brand-surface text-[#FF6848] border border-brand-border'
          }`}>
            <Calendar className="w-4 h-4" />
          </div>
        }
        maxWidth="md"
        footer={
          isConfirmed ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary min-h-[38px] px-5 text-xs font-bold shadow-2xs"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 w-full">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary min-h-[38px] px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmedEventTitle(currentEvent);
                  if (showFeedbackToast) showFeedbackToast('Seat reserved! Digital pass added to your profile.', 'success');
                }}
                className="btn-primary min-h-[38px] px-5 text-xs font-bold shadow-2xs"
              >
                Reserve Seat
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {isConfirmed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-primary">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <div>
                  <div className="font-bold text-sm text-primary">Seat Reserved Successfully</div>
                  <div className="text-xs text-emerald-500 mt-0.5 font-semibold">Digital pass added to your campus profile.</div>
                </div>
              </div>

              <div className="p-3 bg-surface-muted border border-subtle rounded-xl space-y-2 text-xs text-secondary font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted" />
                  <span>Saturday, 10:00 AM – 1:30 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted" />
                  <span>Makerspace Lab 402, Academic Block 4</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-surface-muted border border-subtle rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">Seat Availability</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    8 seats remaining
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-subtle">
                  <div className="bg-[#FF6848] h-2 rounded-full w-[80%]" />
                </div>
                <p className="text-xs text-muted font-medium">
                  32 of 40 seats filled. Kits and development boards will be provided in Lab 402.
                </p>
              </div>

              <div className="space-y-2 text-xs text-secondary font-medium px-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted" />
                  <span>Saturday, 10:00 AM – 1:30 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted" />
                  <span>Makerspace Lab 402, Academic Block 4</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  // 3. NOTIFICATIONS MODAL
  if (modalType === 'notifications') {
    return (
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Campus Notifications"
        subtitle="Recent notices, club updates, and activity alerts"
        icon={
          <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center border border-brand-border">
            <Bell className="w-4 h-4" />
          </div>
        }
        maxWidth="lg"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-4 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            Mark All as Read
          </button>
        }
      >
        <div className="space-y-2 divide-y divide-subtle text-xs">
          <div className="pt-2 first:pt-0 space-y-0.5">
            <div className="font-bold text-primary">Robotics Club: Lab 402 Machine Slot Open</div>
            <div className="text-secondary font-medium">Safety signoff complete. CNC and 3D printing available Saturday.</div>
            <div className="text-[11px] text-muted font-medium">10 minutes ago</div>
          </div>
          <div className="pt-2.5 space-y-0.5">
            <div className="font-bold text-primary">Examination Cell: Semester Finals Hall Tickets</div>
            <div className="text-secondary font-medium">Digital hall tickets now accessible via academic single sign-on.</div>
            <div className="text-[11px] text-muted font-medium">2 hours ago</div>
          </div>
          <div className="pt-2.5 space-y-0.5">
            <div className="font-bold text-primary">Career Development Centre: Final Shortlist</div>
            <div className="text-secondary font-medium">Interview slots confirmed for Texas Instruments drive in Block 4.</div>
            <div className="text-[11px] text-muted font-medium">Yesterday</div>
          </div>
        </div>
      </ModalShell>
    );
  }

  // 4. PROFILE / IDENTITY MODAL
  if (modalType === 'profile') {
    return (
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Student Profile"
        subtitle="Campus Single Sign-On Identity"
        icon={
          <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center border border-brand-border">
            <User className="w-4 h-4" />
          </div>
        }
        maxWidth="md"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-subtle">
            <div className="w-12 h-12 rounded-xl bg-brand-surface text-[#FF6848] flex items-center justify-center font-bold text-lg border border-brand-border font-brand">
              {(modalData?.username || 'A').charAt(0)}
            </div>
            <div>
              <h4 className="font-brand font-bold text-sm sm:text-base text-primary">
                {modalData?.username || 'Ananya Sharma'}
              </h4>
              <p className="text-xs text-muted font-medium">
                {(modalData?.handle || 'ananya_s').replace(/^u\//, '')} · {modalData?.role || 'Student'}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-medium">
            <div className="flex justify-between py-1.5 border-b border-subtle">
              <span className="text-muted">Department</span>
              <span className="font-bold text-primary">{modalData?.department || 'Academic Block 4, Lab 402'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-subtle">
              <span className="text-muted">Roll Number</span>
              <span className="font-mono font-bold text-primary">{modalData?.rollNumber || '21BCE1084'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-subtle">
              <span className="text-muted">Activity Points</span>
              <span className="font-bold text-emerald-500">{modalData?.karma || '1,240'} pts</span>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  // 5. G-CODE SUBMISSION MODAL
  if (modalType === 'gcode') {
    return (
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Submit 3D Print Job"
        subtitle="Makerspace Lab 402 · Prusa MK4 Queue"
        icon={
          <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center border border-brand-border">
            <Printer className="w-4 h-4" />
          </div>
        }
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary px-4 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              Enqueue G-Code
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <p className="text-xs text-secondary font-medium">
            Submit your pre-sliced G-Code to the automated lab queue. Bed temperature calibration will be validated automatically.
          </p>
          <div className="p-3 bg-surface-muted border border-subtle rounded-lg space-y-1 text-xs">
            <div className="font-bold text-primary">Active Target: Prusa MK4 #02</div>
            <div className="text-muted font-medium">Filament: PLA+ 1.75mm · Estimated queue wait: 45m</div>
          </div>
        </div>
      </ModalShell>
    );
  }

  return null;
}
