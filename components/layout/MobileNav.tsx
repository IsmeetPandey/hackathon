'use client';

import React from 'react';
import { Home, FileText, Users, User, Plus } from 'lucide-react';
import { ViewMode } from '@/types';

interface MobileNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenCreatePost?: () => void;
  onOpenProfile?: () => void;
}

export default function MobileNav({
  currentView,
  onSelectView,
  onOpenCreatePost,
  onOpenProfile,
}: MobileNavProps) {
  const isHome = currentView === 'all-campus';
  const isNotices = currentView === 'notices';
  const isCommunities = currentView === 'communities' || currentView === 'robotics-club';
  const isProfile = currentView === 'profile';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface backdrop-blur-xl border-t border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-15 items-center px-1 relative">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onSelectView('all-campus')}
          className={`min-h-[44px] flex flex-col items-center justify-center h-full transition-all relative rounded-lg cursor-pointer ${
            isHome
              ? 'text-[#FF6848] font-bold'
              : 'text-muted hover:text-primary active:bg-surface-muted'
          }`}
          aria-label="Home"
          aria-current={isHome ? 'page' : undefined}
        >
          <div className={`p-1 rounded-lg ${isHome ? 'bg-[#FF6848]/10' : ''}`}>
            <Home className={`w-5 h-5 transition-transform ${isHome ? 'scale-105 stroke-[2.25]' : 'stroke-[1.75]'}`} />
          </div>
          <span className="text-[10.5px] mt-0.5 tracking-tight font-medium">
            Home
          </span>
        </button>

        {/* 2. Notices */}
        <button
          type="button"
          onClick={() => onSelectView('notices')}
          className={`min-h-[44px] flex flex-col items-center justify-center h-full transition-all relative rounded-lg cursor-pointer ${
            isNotices
              ? 'text-[#FF6848] font-bold'
              : 'text-muted hover:text-primary active:bg-surface-muted'
          }`}
          aria-label="Official Notices"
          aria-current={isNotices ? 'page' : undefined}
        >
          <div className={`p-1 rounded-lg ${isNotices ? 'bg-[#FF6848]/10' : ''}`}>
            <FileText className={`w-5 h-5 transition-transform ${isNotices ? 'scale-105 stroke-[2.25]' : 'stroke-[1.75]'}`} />
          </div>
          <span className="text-[10.5px] mt-0.5 tracking-tight font-medium">
            Notices
          </span>
        </button>

        {/* 3. CENTER ELEVATED POST ACTION */}
        <div className="flex flex-col items-center justify-center h-full relative -top-3">
          <button
            type="button"
            onClick={onOpenCreatePost}
            aria-label="Create New Post"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6848] via-[#FF5733] to-[#7C3AED] hover:from-[#E95739] hover:to-[#6D28D9] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(255,104,72,0.42)] active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-[#151D2D]"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] mt-1 font-bold text-[#FF6848] tracking-tight">
            Post
          </span>
        </div>

        {/* 4. Communities */}
        <button
          type="button"
          onClick={() => onSelectView('communities')}
          className={`min-h-[44px] flex flex-col items-center justify-center h-full transition-all relative rounded-lg cursor-pointer ${
            isCommunities
              ? 'text-[#FF6848] font-bold'
              : 'text-muted hover:text-primary active:bg-surface-muted'
          }`}
          aria-label="Communities"
          aria-current={isCommunities ? 'page' : undefined}
        >
          <div className={`p-1 rounded-lg ${isCommunities ? 'bg-[#FF6848]/10' : ''}`}>
            <Users className={`w-5 h-5 transition-transform ${isCommunities ? 'scale-105 stroke-[2.25]' : 'stroke-[1.75]'}`} />
          </div>
          <span className="text-[10.5px] mt-0.5 tracking-tight font-medium">
            Spaces
          </span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            else onSelectView('profile');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center h-full transition-all relative rounded-lg cursor-pointer ${
            isProfile
              ? 'text-[#FF6848] font-bold'
              : 'text-muted hover:text-primary active:bg-surface-muted'
          }`}
          aria-label="User Profile"
          aria-current={isProfile ? 'page' : undefined}
        >
          <div className={`p-1 rounded-lg ${isProfile ? 'bg-[#FF6848]/10' : ''}`}>
            <User className={`w-5 h-5 transition-transform ${isProfile ? 'scale-105 stroke-[2.25]' : 'stroke-[1.75]'}`} />
          </div>
          <span className="text-[10.5px] mt-0.5 tracking-tight font-medium">
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
}
