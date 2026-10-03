'use client';

import React from 'react';
import { Check, Info, AlertCircle, X } from 'lucide-react';

export interface ToastInfo {
  id?: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface AppToastProps {
  toast: ToastInfo | null;
  onClose: () => void;
}

export default function AppToast({ toast, onClose }: AppToastProps) {
  if (!toast) return null;

  const type = toast.type || 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#1A1A1B] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-medium flex items-center justify-between gap-3 border border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
        {type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className="truncate leading-snug">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="text-gray-400 hover:text-white p-0.5 rounded transition shrink-0 focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
