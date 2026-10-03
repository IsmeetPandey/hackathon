'use client';

import React, { useState } from 'react';
import { DEMO_COMMUNITIES } from '@/lib/mockData';
import { Community } from '@/types';
import { Users, Search, ArrowRight, Check, Compass } from 'lucide-react';

interface CommunitiesViewProps {
  onOpenCommunity: (slugOrName: string) => void;
  onOpenCreatePost?: () => void;
}

// Clean readable names mapping to remove raw c/ prefix
function getDisplayCommunityName(name: string): string {
  switch (name.toLowerCase()) {
    case 'roboticsclub':
    case 'c/roboticsclub':
      return 'Robotics Club';
    case 'examination_cell':
    case 'c/examination_cell':
      return 'Examination Cell';
    case 'placement_office':
    case 'c/placement_office':
      return 'Career & Placements';
    case 'coding_algorithms':
    case 'c/coding_algorithms':
      return 'Coding & Algorithms';
    case 'ieee_student_branch':
    case 'c/ieee_student_branch':
      return 'IEEE Student Branch';
    case 'hackathon_teams':
    case 'c/hackathon_teams':
      return 'Hackathon Commons';
    case 'campus_general':
    case 'c/campus_general':
      return 'Campus General & Discussion';
    default:
      return name.replace('c/', '').replace('_', ' ');
  }
}

const EXTENDED_COMMUNITIES: Community[] = [
  ...DEMO_COMMUNITIES,
  {
    id: 'comm-4',
    name: 'coding_algorithms',
    slug: 'c/coding_algorithms',
    prefix: 'c/',
    title: 'ACM & Competitive Programming Hub',
    description: 'Weekly algorithm contests, LeetCode discussion, system design, and open-source projects.',
    memberCount: 2180,
    category: 'club',
    tier: 'Student Club',
    createdAt: '2023-09-01T00:00:00.000Z',
  },
  {
    id: 'comm-5',
    name: 'ieee_student_branch',
    slug: 'c/ieee_student_branch',
    prefix: 'c/',
    title: 'IEEE Student Chapter',
    description: 'Signal processing, hardware workshops, research paper reading groups, and guest faculty lectures.',
    memberCount: 1650,
    category: 'club',
    tier: 'Professional Society',
    createdAt: '2023-09-15T00:00:00.000Z',
  },
  {
    id: 'comm-6',
    name: 'hackathon_teams',
    slug: 'c/hackathon_teams',
    prefix: 'c/',
    title: 'Hackathon & Builder Commons',
    description: 'Find teammates, share project prototypes, brainstorm demo day ideas, and find travel grants.',
    memberCount: 3420,
    category: 'commons',
    tier: 'Student Commons',
    createdAt: '2023-10-01T00:00:00.000Z',
  },
];

export default function CommunitiesView({ onOpenCommunity }: CommunitiesViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({
    'comm-1': true,
    'comm-4': true,
  });

  const categories = ['All', 'Clubs & Societies', 'Academic & Career', 'Student Commons'];

  const handleToggleJoin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJoinedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filtered = EXTENDED_COMMUNITIES.filter((comm) => {
    if (activeCategory === 'Clubs & Societies' && comm.category !== 'club') return false;
    if (activeCategory === 'Academic & Career' && comm.category !== 'official') return false;
    if (activeCategory === 'Student Commons' && comm.category !== 'commons') return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      getDisplayCommunityName(comm.name).toLowerCase().includes(query) ||
      comm.title.toLowerCase().includes(query) ||
      comm.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Introduction */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#FF4500]">
          <Compass className="w-4 h-4" />
          <span>Campus Directory &amp; Hubs</span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#111827] tracking-tight">
          Communities
        </h1>
        <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
          Discover student clubs, technical teams, and collaborative hubs across the college campus.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#FF4500] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF4500] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((comm) => {
          const isJoined = !!joinedMap[comm.id];
          const displayName = getDisplayCommunityName(comm.name);

          return (
            <div
              key={comm.id}
              onClick={() => onOpenCommunity(comm.name)}
              className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-xl p-5 shadow-xs transition cursor-pointer flex flex-col justify-between group space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] border border-[#FED7AA] flex items-center justify-center font-bold text-sm text-[#FF4500] shrink-0">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#111827] group-hover:text-[#FF4500] transition">
                        {displayName}
                      </h2>
                      <span className="text-xs text-[#6B7280]">
                        {comm.memberCount.toLocaleString()} members
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleJoin(comm.id, e)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isJoined
                        ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151]'
                        : 'bg-[#FF4500] hover:bg-[#E03D00] text-white shadow-2xs'
                    }`}
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </button>
                </div>

                <p className="text-xs text-[#4B5563] leading-relaxed mt-3">
                  {comm.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] text-xs">
                <span className="text-[#6B7280]">
                  {comm.category === 'official' ? 'Official Office' : 'Student Community'}
                </span>
                <span className="font-semibold text-[#FF4500] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Feed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
