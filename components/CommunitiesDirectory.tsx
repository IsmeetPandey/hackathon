'use client';

import React, { useState } from 'react';
import { ViewMode } from '@/types';
import { DEMO_COMMUNITIES } from '@/lib/mockData';
import { Search, Compass, Shield, Users, MessageSquare, ArrowRight } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'official' | 'club' | 'commons'>('all');
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({
    'comm-1': true, // Robotics Club
  });

  const toggleJoin = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isJoined = !!joinedMap[id];
    setJoinedMap((prev) => ({ ...prev, [id]: !isJoined }));
    if (showFeedbackToast) {
      showFeedbackToast(!isJoined ? `Joined ${title}` : `Left ${title}`, 'info');
    }
  };

  const handleOpenSpace = (comm: typeof DEMO_COMMUNITIES[0]) => {
    if (comm.slug.includes('robotics') || comm.name.toLowerCase().includes('robotics')) {
      onSelectView('robotics-club');
    } else if (onOpenCommunityDetail) {
      onOpenCommunityDetail(comm.name);
    } else {
      onSelectView('communities');
    }
  };

  const filteredCommunities = DEMO_COMMUNITIES.filter((c) => {
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
      {/* Compact Discovery Header & Search Area */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Campus Communities
            </h1>
            <p className="text-xs sm:text-[13px] text-muted mt-0.5 font-medium">
              Explore official spaces, student clubs, and collegiate commons
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

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredCommunities.length === 0 ? (
          <div className="col-span-full surface-elevated rounded-2xl p-8 text-center text-xs text-muted font-medium">
            No communities matching &quot;{search}&quot;.
          </div>
        ) : (
          filteredCommunities.map((comm) => {
            const isJoined = !!joinedMap[comm.id];
            const isOfficial = comm.category === 'official' || comm.category === 'academic';
            const isClub = comm.category === 'club';

            return (
              <div
                key={comm.id}
                className="surface-elevated rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        isOfficial
                          ? 'bg-surface-muted text-secondary border-subtle'
                          : isClub
                          ? 'bg-brand-surface text-[#FF6848] border-brand-border'
                          : 'bg-surface-muted text-muted border-subtle'
                      }`}
                    >
                      {isOfficial ? (
                        <Shield className="w-3 h-3" />
                      ) : isClub ? (
                        <Users className="w-3 h-3" />
                      ) : (
                        <MessageSquare className="w-3 h-3" />
                      )}
                      <span>{comm.tier}</span>
                    </span>

                    <span className="text-xs text-muted font-semibold">
                      {comm.memberCount.toLocaleString()} members
                    </span>
                  </div>

                  <h3 className="font-brand text-sm sm:text-base font-bold text-primary group-hover:text-[#FF6848] transition-colors leading-snug">
                    {comm.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-secondary leading-relaxed line-clamp-2">
                    {comm.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-subtle flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleJoin(comm.id, comm.title, e)}
                    className="btn-secondary min-h-[38px] px-3 text-xs"
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSpace(comm)}
                    className="btn-primary min-h-[38px] px-3.5 text-xs shadow-2xs"
                  >
                    <span>Open Space</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
