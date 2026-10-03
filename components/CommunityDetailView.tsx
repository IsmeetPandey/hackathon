'use client';

import React, { useState } from 'react';
import { UserProfile, ViewMode } from '@/types';
import { ALL_CAMPUS_POSTS, DEMO_COMMUNITIES } from '@/lib/mockData';
import {
  Users,
  ArrowLeft,
  Plus,
  Check,
  Sparkles,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface CommunityDetailViewProps {
  communitySlug: string;
  user: UserProfile;
  onOpenCreatePost: () => void;
  onOpenPdfModal: (fileName: string) => void;
  onBack: () => void;
}

export default function CommunityDetailView({
  communitySlug,
  onOpenCreatePost,
  onOpenPdfModal,
  onBack,
}: CommunityDetailViewProps) {
  const [isJoined, setIsJoined] = useState(false);

  // Match community from DEMO_COMMUNITIES or generate clean data
  const community = DEMO_COMMUNITIES.find(
    (c) =>
      c.slug.toLowerCase().includes(communitySlug.toLowerCase()) ||
      c.name.toLowerCase().includes(communitySlug.toLowerCase()) ||
      communitySlug.toLowerCase().includes(c.name.toLowerCase())
  ) || {
    id: 'comm-custom',
    name: communitySlug,
    title: communitySlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: 'Active collegiate community space for discussions, collaboration, and resource sharing.',
    memberCount: 890,
    category: 'commons',
  };

  // Filter posts that relate to this community or provide sample discussion
  const communityPosts = ALL_CAMPUS_POSTS.filter(
    (p) =>
      p.community.toLowerCase().includes(communitySlug.toLowerCase()) ||
      community.name.toLowerCase().includes(p.community.toLowerCase())
  );

  const displayPosts = communityPosts.length > 0 ? communityPosts : ALL_CAMPUS_POSTS.slice(0, 2);

  return (
    <div className="max-w-[1040px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Communities</span>
      </button>

      {/* Community Header Banner */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-[#FF6848] font-bold text-xl shrink-0 font-brand">
              {community.title.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
                  {community.title.split('(')[0].trim()}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-surface text-[#FF6848] rounded-md border border-brand-border capitalize">
                  {community.category || 'Community'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secondary mt-1 max-w-xl leading-relaxed font-medium">
                {community.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted mt-1.5 font-semibold">
                <span><strong className="text-primary">{community.memberCount.toLocaleString()}</strong> members</span>
                <span>·</span>
                <span>Collegiate Space</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsJoined(!isJoined)}
              className="btn-secondary flex-1 sm:flex-none min-h-[40px] px-4 text-xs font-bold"
            >
              {isJoined ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Joined</span>
                </>
              ) : (
                <span>Join Space</span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary flex-1 sm:flex-none min-h-[40px] px-4 text-xs font-bold shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="font-brand text-base font-bold text-primary">Community Discussions</h2>
          <span className="text-xs font-semibold text-muted">{displayPosts.length} discussions</span>
        </div>

        {displayPosts.map((post) => (
          <article
            key={post.id}
            className="surface-elevated rounded-2xl p-4 sm:p-5 transition space-y-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted font-medium">
              <span className="font-bold text-primary">{post.author.replace(/^u\//, '')}</span>
              <span>·</span>
              <span>{post.timestamp}</span>
            </div>

            <h3 className="font-brand text-base sm:text-lg font-bold text-primary leading-snug">
              {post.title}
            </h3>

            <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line font-medium">
              {post.content}
            </p>

            {post.attachment && (
              <div className="p-3 bg-surface-muted border border-subtle rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#FF6848] shrink-0" />
                  <span className="font-bold text-primary truncate">
                    {post.attachment.fileName || 'Attached Reference Document'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPdfModal(post.attachment?.fileName || 'circular_endsem_schedule_latest.pdf')}
                  className="px-3 py-1 bg-surface border border-subtle hover:border-[#FF6848] text-xs font-bold text-primary rounded-lg transition shrink-0 cursor-pointer"
                >
                  View
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2.5 border-t border-subtle text-xs font-semibold text-secondary">
              <div className="flex items-center bg-surface-muted rounded-lg p-0.5 border border-subtle">
                <button type="button" className="p-1.5 rounded-md hover:text-[#FF6848] cursor-pointer">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-bold text-primary">{post.upvotes}</span>
                <button type="button" className="p-1.5 rounded-md hover:text-blue-500 cursor-pointer">
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-muted border border-transparent hover:border-subtle cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                <span>{post.commentsCount} Comments</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open-campus-ai', {
                      detail: { prompt: `Summarize this community discussion: "${post.title}"` },
                    })
                  );
                }}
                className="flex items-center gap-1 text-[#FF6848] hover:bg-brand-surface px-2.5 py-1.5 rounded-lg transition cursor-pointer font-ai font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
