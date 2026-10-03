'use client';

import React from 'react';
import { ViewMode } from '@/types';
import { DEMO_MODE } from '@/lib/mockData';
import {
  Home,
  FileText,
  Users,
  Bookmark,
  Activity,
  Bot,
  HelpCircle,
  User,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenQuickModal: (modalType: 'sis' | 'rules' | 'help' | 'profile') => void;
  onOpenProfile?: () => void;
}

export default function Sidebar({
  currentView,
  onSelectView,
  onOpenQuickModal,
  onOpenProfile,
}: SidebarProps) {
  const isHome = currentView === 'all-campus';
  const isNotices = currentView === 'notices';
  const isCommunities = currentView === 'communities' || currentView === 'robotics-club';
  const isSaved = currentView === 'saved';
  const isActivity = currentView === 'my-activity';
  const isProfile = currentView === 'profile';
  const isSettings = currentView === 'settings';

  return (
    <aside
      aria-label="Desktop Navigation"
      className="fixed left-0 top-14 sm:top-16 bottom-0 w-60 bg-surface backdrop-blur-md border-r border-subtle flex flex-col justify-between overflow-y-auto z-30 p-3 text-sm font-medium hidden md:flex space-y-4"
    >
      <div className="space-y-4">
        {/* SECTION 1: DISCOVER */}
        <div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-1">
            Campus
          </div>
          <nav className="space-y-0.5" aria-label="Main Navigation">
            {/* Home */}
            <button
              type="button"
              onClick={() => onSelectView('all-campus')}
              aria-current={isHome ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
                isHome
                  ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
                  : 'text-secondary hover:bg-surface-muted hover:text-primary'
              }`}
            >
              <Home className={`w-4 h-4 ${isHome ? 'text-[#FF6848]' : 'text-muted'}`} />
              <span>Campus Feed</span>
            </button>

            {/* Notices */}
            <button
              type="button"
              onClick={() => onSelectView('notices')}
              aria-current={isNotices ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
                isNotices
                  ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
                  : 'text-secondary hover:bg-surface-muted hover:text-primary'
              }`}
            >
              <FileText className={`w-4 h-4 ${isNotices ? 'text-[#FF6848]' : 'text-muted'}`} />
              <span>Notices</span>
            </button>

            {/* Communities */}
            <button
              type="button"
              onClick={() => onSelectView('communities')}
              aria-current={isCommunities ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
                isCommunities
                  ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
                  : 'text-secondary hover:bg-surface-muted hover:text-primary'
              }`}
            >
              <Users className={`w-4 h-4 ${isCommunities ? 'text-[#FF6848]' : 'text-muted'}`} />
              <span>Communities</span>
            </button>
          </nav>
        </div>

        {/* SECTION 2: YOUR SPACE */}
        <div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-1">
            Your Space
          </div>
          <nav className="space-y-0.5" aria-label="User Space Navigation">
            {/* Saved */}
            <button
              type="button"
              onClick={() => onSelectView('saved')}
              aria-current={isSaved ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
                isSaved
                  ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
                  : 'text-secondary hover:bg-surface-muted hover:text-primary'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#FF6848]' : 'text-muted'}`} />
              <span>Saved</span>
            </button>

            {/* My Activity */}
            <button
              type="button"
              onClick={() => onSelectView('my-activity')}
              aria-current={isActivity ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
                isActivity
                  ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
                  : 'text-secondary hover:bg-surface-muted hover:text-primary'
              }`}
            >
              <Activity className={`w-4 h-4 ${isActivity ? 'text-[#FF6848]' : 'text-muted'}`} />
              <span>My Activity</span>
            </button>
          </nav>
        </div>

        {/* SECTION 3: ASSISTANCE */}
        <div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider px-3 mb-1">
            Assistance
          </div>
          <nav className="space-y-0.5" aria-label="Tools Navigation">
            {/* Campus AI */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-campus-ai'))}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-secondary hover:bg-surface-muted hover:text-primary transition text-left text-sm cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#FF6848]" />
              <span className="font-ai font-medium">Campus AI</span>
            </button>

            {/* Help */}
            <button
              type="button"
              onClick={() => onOpenQuickModal('help')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-secondary hover:bg-surface-muted hover:text-primary transition text-left text-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-muted" />
              <span>Help &amp; Support</span>
            </button>
          </nav>
        </div>
      </div>

      {/* SECTION 4: INTEGRATED PROFILE & SETTINGS */}
      <div className="pt-3 border-t border-subtle space-y-0.5">
        {/* Profile */}
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            else onSelectView('profile');
          }}
          aria-current={isProfile ? 'page' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
            isProfile
              ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
              : 'text-secondary hover:bg-surface-muted hover:text-primary'
          }`}
        >
          <User className={`w-4 h-4 ${isProfile ? 'text-[#FF6848]' : 'text-muted'}`} />
          <span>Profile</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => onSelectView('settings')}
          aria-current={isSettings ? 'page' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left text-sm cursor-pointer ${
            isSettings
              ? 'bg-brand-surface text-[#FF6848] font-semibold border border-[#FF6848]/20'
              : 'text-secondary hover:bg-surface-muted hover:text-primary'
          }`}
        >
          <Settings className={`w-4 h-4 ${isSettings ? 'text-[#FF6848]' : 'text-muted'}`} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
