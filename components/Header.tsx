'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ViewMode, UserProfile } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import {
  Search,
  Bell,
  Plus,
  Sun,
  Moon,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  MessageSquare,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchFocus: () => void;
  isSearchOpen: boolean;
  onOpenCreatePost: () => void;
  user: UserProfile;
  onOpenNotifications: () => void;
  onOpenMessages?: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
}

export default function Header({
  onSelectView,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onOpenCreatePost,
  user,
  onOpenNotifications,
  onOpenMessages,
  onOpenProfile,
  onLogout,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [unreadCount] = useState(2);
  const [unreadMessagesCount] = useState(3);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-surface backdrop-blur-md border-b border-subtle flex items-center justify-between px-3 sm:px-4 md:px-6 z-40 transition-colors duration-200">
      {/* Mobile Active Search Bar */}
      {isMobileSearchActive ? (
        <div className="w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              placeholder="Search campus, communities & notices..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-surface-muted border border-subtle rounded-lg text-primary placeholder:text-muted outline-none focus:border-[#FF6848]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchActive(false)}
            className="text-xs font-semibold text-muted hover:text-primary px-2 py-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* 1. LEFT: Brand / Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectView('all-campus')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6848] flex items-center justify-center text-white font-extrabold text-base shadow-[0_2px_8px_rgba(255,104,72,0.3)] group-hover:scale-105 transition-transform">
                <span className="font-brand">C</span>
              </div>
              <div className="hidden min-[380px]:block">
                <span className="font-brand font-black text-base sm:text-lg text-primary tracking-tight">
                  Campus<span className="text-[#FF6848]">Connect</span>
                </span>
              </div>
            </button>
          </div>

          {/* 2. CENTER: Desktop Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (e.target.value.trim().length > 0) onSearchFocus();
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) onSearchFocus();
                }}
                placeholder="Search campus, communities, and notices..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-surface-muted hover:bg-surface hover:border-strong focus:bg-surface border border-subtle rounded-lg text-primary placeholder:text-muted outline-none focus:border-[#FF6848] focus:ring-1 focus:ring-[#FF6848] transition"
              />
            </div>
          </div>

          {/* 3. RIGHT: Search (Mobile), Messages, Quick Post, Theme Toggle, Notifications, Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(true);
                onSearchFocus();
              }}
              aria-label="Search campus"
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary hover:bg-surface-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6848] transition cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Header Action: Secondary quick post trigger */}
            <button
              type="button"
              onClick={onOpenCreatePost}
              aria-label="New Post"
              title="Create new post"
              className="hidden lg:inline-flex btn-secondary min-h-[36px] px-3 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF6848]" />
              <span>Post</span>
            </button>

            {/* Messages Side Panel Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenMessages) onOpenMessages();
                else onSelectView('messages');
              }}
              aria-label="Campus Messages"
              title="Open Direct Messages"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary hover:bg-surface-muted rounded-lg transition relative focus:outline-none focus:ring-2 focus:ring-[#FF6848] cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-2 right-1.5 w-4 h-4 bg-[#FF6848] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-surface">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary hover:bg-surface-muted rounded-lg transition relative focus:outline-none focus:ring-2 focus:ring-[#FF6848] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4.5 h-4.5 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Campus Notifications"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary hover:bg-surface-muted rounded-lg transition relative focus:outline-none focus:ring-2 focus:ring-[#FF6848] cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6848] rounded-full ring-2 ring-white dark:ring-[#121826]" />
              )}
            </button>

            {/* Profile Avatar & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="User Profile Menu"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-lg hover:bg-surface-muted transition focus:outline-none focus:ring-2 focus:ring-[#FF6848] cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-surface-muted border border-subtle flex items-center justify-center relative">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username || 'User avatar'}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-52 sm:w-56 bg-surface-elevated border border-subtle rounded-xl shadow-xl z-50 py-1 divide-y divide-subtle animate-in fade-in zoom-in-95 duration-75"
                  >
                    <div className="px-3.5 py-2.5">
                      <div className="text-xs font-bold text-primary truncate">
                        {user.username}
                      </div>
                      <div className="text-[11px] text-muted truncate font-medium">
                        {user.handle}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5 truncate">
                        {user.role}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenMessages) onOpenMessages();
                          else onSelectView('messages');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#FF6848]" />
                        <span>Direct Messages</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenProfile) onOpenProfile();
                          else onSelectView('profile');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary transition"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-muted" />
                        <span>Profile &amp; Identity</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSelectView('settings');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary transition"
                      >
                        <Settings className="w-3.5 h-3.5 text-muted" />
                        <span>Account Settings</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
