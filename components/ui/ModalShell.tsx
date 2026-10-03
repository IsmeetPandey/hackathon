'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'lg',
}: ModalShellProps) {
  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClass} surface-elevated rounded-t-2xl sm:rounded-2xl border-t sm:border border-subtle overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150 flex flex-col max-h-[92dvh] sm:max-h-[88vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-subtle bg-surface/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 id="modal-title" className="font-brand font-bold text-sm sm:text-base text-primary truncate">
                {title}
              </h2>
              {subtitle && <p className="text-[11px] sm:text-xs text-muted truncate font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary rounded-lg hover:bg-surface-muted transition shrink-0 -mr-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - scrollable on mobile */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain text-primary">{children}</div>

        {/* Sticky Footer with safe-area bottom padding on mobile */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t border-subtle bg-surface/80 backdrop-blur-md flex items-center justify-end gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
