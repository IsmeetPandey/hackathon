'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode, Community, UserProfile } from '@/types';
import {
  listCommunities,
  joinCommunity,
  leaveCommunity,
  checkCommunityMembership,
} from '@/lib/dbService';
import { useAuth } from '@/context/AuthContext';
import { Search, Compass, Shield, Users, ArrowRight, Loader2 } from 'lucide-react';

interface CommunitiesDirectoryProps {
  onSelectView: (view: ViewMode) => void;
  onOpenCommunityDetail?: (slug: string) => void;
  showFeedbackToast?: (msg: string, type?: 'info' | 'success') => void;
}

export default function CommunitiesDirectory({
  onSelectView,
  onOpenCommunityDetail,
  showFeedbackToast,
}: CommunitiesDirectoryProps) {
  const { userProfile } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'official' | 'club' | 'commons'>('all');
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const notify = useCallback((msg: string, type: 'info' | 'success' = 'info') => {
    if (showFeedbackToast) {
      showFeedbackToast(msg, type);
    }
  }, [showFeedbackToast]);

  // Fetch communities from Firestore
  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const commList = await listCommunities();
        if (!ignore) {
          setCommunities(commList);
          if (userProfile.id) {
            const statusMap: Record<string, boolean> = {};
            for (const c of commList) {
              const isJoined = await checkCommunityMembership(c.id, userProfile.id);
              statusMap[c.id] = isJoined;
            }
            setJoinedMap(statusMap);
          }
        }
      } catch (err) {
        console.error('Error loading communities from Firestore:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [userProfile.id]);

  const toggleJoin = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile.id) {
      notify('Please sign in to join spaces', 'info');
      return;
    }

    const current = !!joinedMap[id];
    setJoinedMap((prev) => ({ ...prev, [id]: !current }));
    notify(!current ? `Joined ${name}` : `Left ${name}`, 'info');

    try {
      if (!current) {
        await joinCommunity(id, userProfile.id, userProfile.handle);
      } else {
        await leaveCommunity(id, userProfile.id);
      }
    } catch (err) {
      console.error('Firestore membership sync error:', err);
    }
  };

  const handleOpenSpace = (comm: Community) => {
    if (comm.slug.includes('robotics') || comm.name.toLowerCase().includes('robotics')) {
      onSelectView('robotics-club');
    } else if (onOpenCommunityDetail) {
      onOpenCommunityDetail(comm.slug || comm.name);
    } else {
      onSelectView('communities');
    }
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  return (
    <div className="max-w-[1040px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header & Search Area */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-5 space-y-3.5 border border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Campus Communities
            </h1>
            <p className="text-xs sm:text-[13px] text-muted mt-0.5 font-medium">
              Explore official spaces, student clubs, and collegiate commons on Firestore
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search spaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted hover:bg-surface border border-subtle rounded-lg text-primary placeholder:text-muted outline-none focus:border-[#FF6848] focus:bg-surface transition font-medium"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-subtle overflow-x-auto pb-0.5 bg-surface-muted p-1 rounded-xl border">
          {[
            { id: 'all', label: 'All Spaces' },
            { id: 'official', label: 'Official' },
            { id: 'club', label: 'Clubs' },
            { id: 'commons', label: 'Commons' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`filter-segment ${
                activeCategory === cat.id ? 'filter-segment-active' : ''
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF6848]" />
          <span>Loading campus communities from Firestore...</span>
        </div>
      )}

      {/* Communities Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCommunities.map((comm) => {
            const isJoined = !!joinedMap[comm.id];

            return (
              <div
                key={comm.id}
                onClick={() => handleOpenSpace(comm)}
                className="surface-elevated rounded-2xl p-4 sm:p-5 flex flex-col justify-between group transition hover:border-[#FF6848]/40 cursor-pointer shadow-2xs border border-subtle"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-[#FF6848] font-bold text-sm shrink-0 font-brand shadow-2xs">
                        {comm.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-sm sm:text-base text-primary group-hover:text-[#FF6848] transition truncate">
                          {comm.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                          <span className="capitalize">{comm.category}</span>
                          <span>·</span>
                          <span>{comm.memberCount.toLocaleString()} members</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleJoin(comm.id, comm.name, e)}
                      className={`min-h-[32px] px-3 text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer ${
                        isJoined
                          ? 'btn-secondary text-xs py-1 px-3'
                          : 'btn-primary text-xs py-1 px-3'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>

                  <p className="text-xs text-secondary line-clamp-2 leading-relaxed font-medium">
                    {comm.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-subtle flex items-center justify-between text-xs text-muted">
                  <span className="font-mono text-[11px]">c/{comm.slug}</span>
                  <div className="flex items-center gap-1 text-[#FF6848] font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Enter Space</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCommunities.length === 0 && (
            <div className="col-span-full surface-elevated rounded-2xl p-8 text-center space-y-2 border border-subtle">
              <Compass className="w-8 h-8 text-muted mx-auto mb-1" />
              <p className="text-sm font-bold text-primary">No spaces matched &quot;{search}&quot;</p>
              <p className="text-xs text-muted font-medium">
                Try searching for clubs, academic departments, or clear your category filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
