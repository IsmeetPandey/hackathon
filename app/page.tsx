'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AllCampusFeed from '@/components/AllCampusFeed';
import RoboticsClubFeed from '@/components/RoboticsClubFeed';
import CircularIngestionDesk from '@/components/CircularIngestionDesk';
import AcademicLoginPortal from '@/components/AcademicLoginPortal';
import NoticesHub from '@/components/NoticesHub';
import CommunitiesDirectory from '@/components/CommunitiesDirectory';
import CommunityDetailView from '@/components/CommunityDetailView';
import CreatePostModal from '@/components/CreatePostModal';
import QuickModals from '@/components/QuickModals';
import { ToastInfo } from '@/components/ui/AppToast';
import { ViewMode, UserProfile, PostItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Home() {
  const { userProfile, isLoading, logout } = useAuth();
  const [internalView, setInternalView] = useState<ViewMode>('all-campus');
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);
  const [newestPost, setNewestPost] = useState<PostItem | null>(null);

  // Active user profile from AuthContext or local overrides
  const user: UserProfile = localUser || userProfile;

  // If user is not logged in, enforce the authentication portal as the first step
  const currentView: ViewMode = user.isLoggedIn ? internalView : 'login-sso';

  // Global Toast / Feedback state
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Global Modals State
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState<string | null>(null);
  const [quickModalData, setQuickModalData] = useState<any>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleSelectView = (view: ViewMode) => {
    setInternalView(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocalUser(null);
    setInternalView('login-sso');
    showToast('You have been signed out of CampusConnect.', 'info');
  };

  const handleOpenPdf = (fileName: string) => {
    setQuickModalData(fileName);
    setQuickModalType('pdf');
  };

  // Listen for open-pdf-modal event triggered by AI or other components
  React.useEffect(() => {
    const handlePdfEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ fileName?: string }>;
      handleOpenPdf(customEvent.detail?.fileName || 'circular_endsem_schedule_latest.pdf');
    };
    window.addEventListener('open-pdf-modal', handlePdfEvent);
    return () => window.removeEventListener('open-pdf-modal', handlePdfEvent);
  }, []);

  // Listen for open-community-detail event triggered by search or deep links
  React.useEffect(() => {
    const handleCommunityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug: string }>;
      if (customEvent.detail?.slug) {
        if (customEvent.detail.slug.toLowerCase().includes('robotics')) {
          setInternalView('robotics-club');
        } else {
          setSelectedCommunitySlug(customEvent.detail.slug);
          setInternalView('communities');
        }
      }
    };
    window.addEventListener('open-community-detail', handleCommunityEvent);
    return () => window.removeEventListener('open-community-detail', handleCommunityEvent);
  }, []);

  const handleOpenRsvp = (title: string) => {
    setQuickModalData(title);
    setQuickModalType('rsvp');
  };

  const handleOpenQuickModal = (type: 'sis' | 'rules' | 'help' | 'profile' | 'notifications') => {
    if (type === 'help') {
      showToast('Academic Block B, Room 102. Phone: +1 (800) 555-CAMPUS', 'info');
    } else if (type === 'profile') {
      setQuickModalData(user);
      setQuickModalType('profile');
    } else if (type === 'notifications') {
      setQuickModalType('notifications');
    } else if (type === 'rules') {
      setQuickModalData('Campus Academic Code §4.11 & Laboratory Safety Directives');
      setQuickModalType('compliance');
    } else {
      setQuickModalType(type);
    }
  };

  // Post Submission Success Callback
  const handlePostCreated = (post: PostItem) => {
    setNewestPost(post);
    showToast(`Post published to ${post.community}!`, 'success');
  };

  // Decide current page content based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login-sso':
        return (
          <AcademicLoginPortal
            user={user}
            onLoginSuccess={(updatedUser) => {
              setLocalUser(updatedUser);
              showToast(`Welcome back, ${updatedUser.username}!`);
              setInternalView('all-campus');
            }}
          />
        );

      case 'notices':
        return (
          <NoticesHub
            onOpenPdfModal={handleOpenPdf}
            onSelectView={handleSelectView}
          />
        );

      case 'communities':
        if (selectedCommunitySlug) {
          return (
            <CommunityDetailView
              communitySlug={selectedCommunitySlug}
              user={user}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onOpenPdfModal={handleOpenPdf}
              onBack={() => setSelectedCommunitySlug(null)}
            />
          );
        }
        return (
          <CommunitiesDirectory
            onSelectView={handleSelectView}
            onOpenCommunityDetail={(slug) => {
              setSelectedCommunitySlug(slug);
            }}
            showFeedbackToast={showToast}
          />
        );

      case 'robotics-club':
        return (
          <RoboticsClubFeed
            user={user}
            onOpenCreatePost={() => setIsCreatePostOpen(true)}
            onOpenPdfModal={handleOpenPdf}
            onOpenGCodeModal={() => setQuickModalType('gcode')}
            onOpenRsvpModal={handleOpenRsvp}
          />
        );

      case 'ingestion-desk':
        return (
          <CircularIngestionDesk
            onOpenPdfModal={handleOpenPdf}
            onSelectSubreddit={(sub) => {
              if (sub.toLowerCase().includes('robotics')) {
                setInternalView('robotics-club');
              } else {
                setInternalView('all-campus');
              }
            }}
            onBroadcastSuccess={() => {
              showToast('Circular notice published to campus feed.');
              setInternalView('all-campus');
            }}
          />
        );

      case 'saved':
        return (
          <AllCampusFeed
            user={user}
            mode="saved"
            onOpenCreatePost={() => setIsCreatePostOpen(true)}
            onOpenPdfModal={handleOpenPdf}
            onOpenRsvpModal={handleOpenRsvp}
            onSelectView={handleSelectView}
            showFeedbackToast={showToast}
          />
        );

      case 'my-activity':
        return (
          <AllCampusFeed
            user={user}
            mode="activity"
            onOpenCreatePost={() => setIsCreatePostOpen(true)}
            onOpenPdfModal={handleOpenPdf}
            onOpenRsvpModal={handleOpenRsvp}
            onSelectView={handleSelectView}
            showFeedbackToast={showToast}
          />
        );

      case 'profile':
        return (
          <div className="max-w-xl mx-auto p-4 sm:p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs my-2 sm:my-4 space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#F3F4F6]">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF4EE] border border-[#FED7AA] flex items-center justify-center text-[#FF4500] font-extrabold text-xl">
                {user.username.charAt(0)}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#111827] truncate">{user.username}</h1>
                <div className="text-xs sm:text-[13px] text-[#6B7280] font-medium truncate">{user.handle.replace(/^u\//, '')}</div>
                <div className="text-xs font-semibold text-[#FF4500] mt-0.5">{user.role} · {user.department}</div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-[13px]">
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Campus Email</span>
                <span className="font-semibold text-[#111827] text-right">{user.email || 'student@campus.edu'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Program &amp; Department</span>
                <span className="font-semibold text-[#111827] text-right">{user.department}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Student ID</span>
                <span className="font-mono font-semibold text-[#111827]">{user.rollNumber || '21BCE1084'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Campus Contributions</span>
                <span className="font-semibold text-emerald-600">{user.karma} activity points</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Account Standing</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                  Active Student (Good Standing)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSelectView('settings')}
                className="min-h-[44px] px-4 py-2 border border-[#D1D5DB] hover:bg-[#F9FAFB] text-xs font-semibold rounded-xl text-[#374151] transition cursor-pointer flex-1 sm:flex-none text-center"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-xl mx-auto p-4 sm:p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs my-2 sm:my-4 space-y-5">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#111827]">Account &amp; Campus Preferences</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">Manage notifications, display preferences, and student credentials.</p>
            </div>

            <div className="space-y-1 text-xs sm:text-[13px] divide-y divide-[#F3F4F6]">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111827]">Profile Identity</div>
                  <div className="text-xs text-[#6B7280]">{user.username} ({user.handle.replace(/^u\//, '')})</div>
                </div>
                <span className="px-2.5 py-1 bg-[#F3F4F6] rounded-md font-semibold text-xs text-[#374151]">
                  {user.role}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111827]">Academic Department</div>
                  <div className="text-xs text-[#6B7280]">{user.department}</div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111827]">Official Notice Alerts</div>
                  <div className="text-xs text-[#6B7280]">Push alerts for timetables, circulars &amp; directives</div>
                </div>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111827]">Community Activity Alerts</div>
                  <div className="text-xs text-[#6B7280]">Discussions in joined student clubs and spaces</div>
                </div>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of CampusConnect</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'all-campus':
      default:
        return (
          <AllCampusFeed
            user={user}
            mode="all"
            newCreatedPost={newestPost}
            onOpenCreatePost={() => setIsCreatePostOpen(true)}
            onOpenPdfModal={handleOpenPdf}
            onOpenRsvpModal={handleOpenRsvp}
            onSelectView={handleSelectView}
            showFeedbackToast={showToast}
          />
        );
    }
  };

  return (
    <AppShell
      currentView={currentView}
      onSelectView={handleSelectView}
      user={user}
      onUserUpdate={(updated) => setLocalUser(updated)}
      onLogout={handleLogout}
      onOpenCreatePost={() => setIsCreatePostOpen(true)}
      onOpenQuickModal={handleOpenQuickModal}
      toast={toast}
      onCloseToast={() => setToast(null)}
    >
      {renderCurrentView()}

      {/* Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmitPost={handlePostCreated}
        user={user}
      />

      {/* Global Quick Utility Modals (RSVP, PDF Viewer, etc.) */}
      <QuickModals
        modalType={quickModalType}
        modalData={quickModalData}
        onClose={() => {
          setQuickModalType(null);
          setQuickModalData(null);
        }}
      />
    </AppShell>
  );
}
