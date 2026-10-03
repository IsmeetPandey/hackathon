'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import BackgroundVideo from '@/components/layout/BackgroundVideo';
import AppToast, { ToastInfo } from '@/components/ui/AppToast';
import SearchResultsOverlay from '@/components/SearchResultsOverlay';
import CampusAIChatbot from '@/components/CampusAIChatbot';
import { ViewMode, UserProfile } from '@/types';

interface AppShellProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
  onLogout: () => void;
  onOpenCreatePost: () => void;
  onOpenQuickModal: (modalType: 'sis' | 'rules' | 'help' | 'profile' | 'notifications') => void;
  toast: ToastInfo | null;
  onCloseToast: () => void;
  children: React.ReactNode;
}

export default function AppShell({
  currentView,
  onSelectView,
  user,
  onLogout,
  onOpenCreatePost,
  onOpenQuickModal,
  toast,
  onCloseToast,
  children,
}: AppShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchResultNavigation = (destination: string) => {
    if (destination.startsWith('notice:')) {
      const fileName = destination.replace('notice:', '');
      onSelectView('notices');
      window.dispatchEvent(new CustomEvent('open-pdf-modal', { detail: { fileName } }));
    } else if (destination.startsWith('community:')) {
      const slug = destination.replace('community:', '');
      window.dispatchEvent(new CustomEvent('open-community-detail', { detail: { slug } }));
    } else if (destination === 'robotics-club' || destination.includes('robotics')) {
      onSelectView('robotics-club');
    } else if (destination === 'notices') {
      onSelectView('notices');
    } else if (destination === 'communities') {
      onSelectView('communities');
    } else {
      onSelectView('all-campus');
    }
  };

  const isAuthView = currentView === 'login-sso';

  return (
    <div className="min-h-screen text-primary flex flex-col font-sans w-full max-w-full overflow-x-hidden relative campus-canvas">
      {/* 1. Global Toast / Feedback */}
      <AppToast toast={toast} onClose={onCloseToast} />

      {/* 2. Real Background Video Layer + Dark/Light Readability Overlay */}
      <BackgroundVideo />

      {/* 3. Top Header: Minimal for Auth, Full for Main App & Admin */}
      {isAuthView ? (
        <header className="fixed top-0 left-0 right-0 h-[56px] sm:h-[64px] bg-surface backdrop-blur-md border-b border-subtle flex items-center justify-between px-4 sm:px-8 shrink-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6848] flex items-center justify-center text-white font-extrabold text-base shadow-[0_2px_8px_rgba(255,104,72,0.3)]">
              <span className="font-brand">C</span>
            </div>
            <span className="font-brand font-bold text-lg text-primary tracking-tight">
              Campus<span className="text-[#FF6848]">Connect</span>
            </span>
          </div>
          <span className="text-xs font-bold text-muted">Academic Portal Login</span>
        </header>
      ) : (
        <Header
          currentView={currentView}
          onSelectView={onSelectView}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.length > 0) setIsSearchOpen(true);
          }}
          onSearchFocus={() => setIsSearchOpen(true)}
          isSearchOpen={isSearchOpen}
          onOpenCreatePost={onOpenCreatePost}
          user={user}
          onOpenNotifications={() => onOpenQuickModal('notifications')}
          onOpenProfile={() => onOpenQuickModal('profile')}
          onLogout={onLogout}
        />
      )}

      {/* 4. Main Body: Sidebar + Page Canvas */}
      <div className="flex w-full max-w-full overflow-x-hidden flex-1 relative z-10">
        {/* Desktop Sidebar: Hidden during Authentication */}
        {!isAuthView && (
          <Sidebar
            currentView={currentView}
            onSelectView={onSelectView}
            onOpenQuickModal={onOpenQuickModal}
            onOpenProfile={() => onOpenQuickModal('profile')}
          />
        )}

        {/* Content Canvas */}
        <main
          className={`flex-1 w-full max-w-full overflow-x-hidden relative ${
            isAuthView
              ? 'pt-[56px] sm:pt-[64px] pb-6 flex items-center justify-center'
              : 'pt-[56px] sm:pt-[64px] content-bottom-space md:pl-60'
          }`}
        >
          {children}
        </main>
      </div>

      {/* 5. Mobile Bottom Navigation: Only for Main Student/Admin Experience */}
      {!isAuthView && (
        <MobileNav
          currentView={currentView}
          onSelectView={onSelectView}
          onOpenCreatePost={onOpenCreatePost}
          onOpenProfile={() => onSelectView('profile')}
        />
      )}

      {/* 6. Live Search Overlay: Only for Non-Auth */}
      {!isAuthView && (
        <SearchResultsOverlay
          query={searchQuery}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={(dest) => {
            handleSearchResultNavigation(dest);
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
        />
      )}

      {/* 7. Campus AI Assistant Utility: Hidden during Auth */}
      {!isAuthView && <CampusAIChatbot />}
    </div>
  );
}
