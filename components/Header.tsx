'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ViewMode, UserProfile } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import {
  Search,
  Plus,
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  X,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  currentView?: ViewMode;
  onSelectView: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchFocus: () => void;
  isSearchOpen?: boolean;
  onOpenCreatePost: () => void;
  user: UserProfile;
  onOpenNotifications?: () => void;
  unreadCount?: number;
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
  unreadCount = 2,
  onOpenProfile,
  onLogout,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] sm:h-[64px] bg-surface backdrop-blur-md border-b border-subtle z-40 flex items-center justify-between px-3 sm:px-6 md:px-8 w-full shadow-2xs">
      {/* Mobile search expanded state */}
      {isMobileSearchActive ? (
        <div className="flex sm:hidden items-center w-full gap-2 py-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.length > 0) onSearchFocus();
              }}
              onFocus={onSearchFocus}
              placeholder="Search campus, notices, communities..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted border border-subtle rounded-lg text-primary placeholder:text-muted outline-none focus:border-[#FF6848] focus:bg-surface font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileSearchActive(false);
              onSearchChange('');
            }}
            aria-label="Close mobile search"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6848]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          {/* 1. LEFT: Brand / Logo */}
          <div className="flex items-center min-w-0 shrink-0">
            <button
              onClick={() => onSelectView('all-campus')}
              className="flex items-center gap-2 group text-left focus:outline-none focus:ring-2 focus:ring-[#FF6848] rounded-lg p-1 transition cursor-pointer"
              aria-label="CampusConnect Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6848] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,104,72,0.3)] shrink-0 group-hover:bg-[#E95739] transition">
                <span className="font-extrabold text-sm sm:text-base tracking-tight font-brand">C</span>
              </div>
              <span className="font-brand font-extrabold text-base sm:text-lg tracking-tight text-primary">
                <span>Campus</span>
                <span className="text-[#FF6848]">Connect</span>
              </span>
            </button>
          </div>

          {/* 2. CENTER: Large Search Field (Desktop only in header, mobile has icon) */}
          <div className="hidden sm:block flex-1 max-w-[540px] mx-4 md:mx-8">
            <div className="relative">
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

          {/* 3. RIGHT: Search (Mobile), Quick Post (Desktop), Theme Toggle, Notifications, Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(true);
                onSearchFocus();
              }}
              aria-label="Search campus"
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary hover:bg-surface-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6848] transition"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Header Action: Secondary quick post trigger */}
            <button
              type="button"
              onClick={onOpenCreatePost}
              aria-label="New Post"
              title="Create new post"
              className="hidden lg:inline-flex btn-secondary min-h-[36px] px-3 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF6848]" />
              <span>Post</span>
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 rounded-lg hover:bg-surface-muted transition focus:outline-none focus:ring-2 focus:ring-[#FF6848]"
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

                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-secondary hover:bg-surface-muted hover:text-primary transition"
                      >
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-muted" />}
                          <span>Appearance</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-muted font-mono uppercase">
                          {theme}
                        </span>
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
