'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostItem, UserProfile, CommentItem, ViewMode } from '@/types';
import { ALL_CAMPUS_POSTS } from '@/lib/mockData';
import CampusPulse from '@/components/CampusPulse';
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share2,
  Bookmark,
  FileText,
  Calendar,
  Sparkles,
  Plus,
  Send,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface AllCampusFeedProps {
  user: UserProfile;
  onOpenCreatePost: () => void;
  onOpenPdfModal: (fileName: string) => void;
  onOpenRsvpModal?: (title: string) => void;
  onSelectView?: (view: ViewMode) => void;
  newCreatedPost?: PostItem | null;
  mode?: 'all' | 'saved' | 'activity';
  showFeedbackToast?: (msg: string, type?: 'success' | 'info') => void;
}

function cleanCommunityTitle(raw: string): string {
  if (raw.toLowerCase().includes('robotics')) return 'Robotics Club';
  if (raw.toLowerCase().includes('coding') || raw.toLowerCase().includes('algorithm')) return 'Coding & Algorithms';
  if (raw.toLowerCase().includes('hackathon')) return 'Hackathon Commons';
  if (raw.toLowerCase().includes('exam')) return 'Examination Cell';
  if (raw.toLowerCase().includes('placement')) return 'Career & Placements';
  if (raw.toLowerCase().includes('ieee')) return 'IEEE Student Branch';
  if (raw.toLowerCase().includes('all-campus')) return 'Campus Discussion';
  return raw.replace('c/', '').replace('_', ' ');
}

export default function AllCampusFeed({
  user,
  onOpenCreatePost,
  onOpenPdfModal,
  onOpenRsvpModal,
  onSelectView,
  newCreatedPost,
  mode = 'all',
  showFeedbackToast,
}: AllCampusFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(ALL_CAMPUS_POSTS);
  const [activeFilter, setActiveFilter] = useState<'hot' | 'new' | 'top'>('hot');

  // Comments state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentDraft, setCommentDraft] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Joined communities state
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({
    'Coding & Algorithms': true,
    'Robotics Club': true,
  });

  const notify = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    if (showFeedbackToast) {
      showFeedbackToast(msg, type);
    }
  }, [showFeedbackToast]);

  // Fetch posts from backend API
  useEffect(() => {
    let ignore = false;
    async function loadPosts() {
      try {
        const res = await fetch(
          `/api/posts?sort=${activeFilter}&userHandle=${encodeURIComponent(user.handle || 'u/ananya_s')}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data.posts) && data.posts.length > 0) {
            setPosts(data.posts);
          }
        }
      } catch (err) {
        console.warn('API posts fetch failed, keeping fallback:', err);
      }
    }
    loadPosts();
    return () => {
      ignore = true;
    };
  }, [activeFilter, user.handle]);

  // Handle voting
  const handleVote = async (id: string, type: 'up' | 'down') => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== id) return post;
        let newUpvotes = post.upvotes;
        let hasUp = post.hasUserUpvoted;
        let hasDown = post.hasUserDownvoted;

        if (type === 'up') {
          if (hasUp) {
            newUpvotes -= 1;
            hasUp = false;
          } else {
            newUpvotes += hasDown ? 2 : 1;
            hasUp = true;
            hasDown = false;
          }
        } else {
          if (hasDown) {
            newUpvotes -= 1;
            hasDown = false;
          } else {
            newUpvotes -= hasUp ? 2 : 1;
            hasDown = true;
            hasUp = false;
          }
        }

        return {
          ...post,
          upvotes: newUpvotes,
          hasUserUpvoted: hasUp,
          hasUserDownvoted: hasDown,
        };
      })
    );

    try {
      await fetch(`/api/posts/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteType: type,
          userHandle: user.handle || 'u/ananya_s',
        }),
      });
    } catch (err) {
      console.error('Vote sync error:', err);
    }
  };

  // Handle save post
  const handleToggleSave = async (id: string) => {
    let nextState = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextState = !p.isSaved;
          return { ...p, isSaved: nextState };
        }
        return p;
      })
    );

    notify(nextState ? 'Saved to Your Space' : 'Removed from saved', 'info');

    try {
      await fetch(`/api/posts/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userHandle: user.handle || 'u/ananya_s',
        }),
      });
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  };

  // Handle share post
  const handleShare = (post: PostItem) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?post=${post.id}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      notify('Link copied to clipboard', 'success');
    }
  };

  // Toggle comments
  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }

    setExpandedCommentsPostId(postId);

    if (!commentsMap[postId]) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsMap((prev) => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch (err) {
        console.warn('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    if (!commentDraft.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentDraft.trim(),
          author: user.username || 'Student',
          authorHandle: user.handle || 'u/ananya_s',
          authorRole: user.role || 'Student',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setCommentDraft('');
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
        notify('Reply published', 'success');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Toggle Community Join
  const handleToggleJoin = async (communityName: string) => {
    const current = !!joinedCommunities[communityName];
    setJoinedCommunities((prev) => ({ ...prev, [communityName]: !current }));
    notify(!current ? `Joined ${communityName}` : `Left ${communityName}`, 'info');

    try {
      const cleanSlug = communityName.toLowerCase().replace(/\s+/g, '_');
      await fetch(`/api/communities/${cleanSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userHandle: user.handle || 'u/ananya_s' }),
      });
    } catch (err) {
      console.warn('Join sync error:', err);
    }
  };

  // Merge newly created post into posts list
  const mergedPosts =
    newCreatedPost && !posts.some((p) => p.id === newCreatedPost.id)
      ? [newCreatedPost, ...posts]
      : posts;

  // Filter posts based on mode
  const displayedPosts = mergedPosts.filter((p) => {
    if (mode === 'saved') return p.isSaved;
    if (mode === 'activity') return p.author === (user.handle || 'u/ananya_s') || p.hasUserUpvoted;
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col xl:flex-row gap-6 justify-center items-start">
        {/* Main Feed Column */}
        <main className="w-full xl:max-w-[760px] flex-1 space-y-4">
          {/* ======================================================== */}
          {/* SIGNATURE CAMPUS PULSE: THE ESSENCE OF CAMPUSCONNECT      */}
          {/* ======================================================== */}
          {mode === 'all' && (
            <CampusPulse
              user={user}
              onSelectView={onSelectView}
              onOpenPdfModal={onOpenPdfModal}
              onOpenRsvpModal={onOpenRsvpModal}
            />
          )}

          {/* Feed Title & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 pb-1">
            <div>
              <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
                {mode === 'saved'
                  ? 'Saved Posts'
                  : mode === 'activity'
                  ? 'Student Activity'
                  : 'Campus Feed'}
              </h1>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {mode === 'saved'
                  ? 'Posts you bookmarked to reference or review later'
                  : mode === 'activity'
                  ? 'Discussions you created, joined, or upvoted'
                  : 'Official announcements, projects, and discussions'}
              </p>
            </div>

            {/* Filter controls & Primary New Post CTA */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {mode === 'all' && (
                <div className="bg-surface-muted p-1 rounded-xl flex items-center gap-0.5 border border-subtle">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('hot')}
                    className={`filter-segment ${
                      activeFilter === 'hot' ? 'filter-segment-active' : ''
                    }`}
                  >
                    Popular
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('new')}
                    className={`filter-segment ${
                      activeFilter === 'new' ? 'filter-segment-active' : ''
                    }`}
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('top')}
                    className={`filter-segment ${
                      activeFilter === 'top' ? 'filter-segment-active' : ''
                    }`}
                  >
                    Top
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onOpenCreatePost}
                className="btn-primary min-h-[40px] px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm shadow-[0_2px_8px_rgba(255,104,72,0.25)]"
              >
                <Plus className="w-4 h-4" />
                <span>New Post</span>
              </button>
            </div>
          </div>

          {/* Posts List */}
          {displayedPosts.length === 0 ? (
            <div className="surface-elevated rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center mx-auto text-muted">
                {mode === 'saved' ? <Bookmark className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-semibold text-primary">
                {mode === 'saved' ? 'No saved posts yet' : 'No posts found'}
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {mode === 'saved'
                  ? 'Click the Save button on any post to bookmark it here for fast access.'
                  : 'Start a conversation by publishing a new post to the campus feed.'}
              </p>
              <button
                type="button"
                onClick={onOpenCreatePost}
                className="btn-primary px-4 py-2 text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Post</span>
              </button>
            </div>
          ) : (
            displayedPosts.map((post) => {
              const displayCommunity = cleanCommunityTitle(post.community);

              return (
                <article
                  key={post.id}
                  className="surface-elevated rounded-2xl p-4 sm:p-5 transition space-y-3"
                >
                  {/* 1. Community + Time + Author */}
                  <div className="flex items-center justify-between text-xs sm:text-[13px] text-muted">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => {
                          if (onSelectView) {
                            if (post.community.toLowerCase().includes('robotics')) onSelectView('robotics-club');
                            else onSelectView('communities');
                          }
                        }}
                        className="font-bold text-primary hover:text-[#FF6848] transition cursor-pointer"
                      >
                        {displayCommunity}
                      </span>
                      <span className="text-muted">·</span>
                      <span>{post.timestamp || 'Just now'}</span>
                      <span className="hidden sm:inline text-muted">·</span>
                      <span className="hidden sm:inline text-muted">
                        by {post.author.replace(/^u\//, '')}
                      </span>
                    </div>

                    {/* Contextual Pinned Badge */}
                    {post.pinned ? (
                      <span className="text-[11px] font-bold text-[#FF6848] bg-brand-surface px-2 py-0.5 rounded border border-brand-border">
                        {post.pinnedLabel || 'PINNED'}
                      </span>
                    ) : null}
                  </div>

                  {/* 2. Post Title */}
                  <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
                    {post.title}
                  </h2>

                  {/* 3. Body */}
                  {post.content && (
                    <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line line-clamp-4 sm:line-clamp-none">
                      {post.content}
                    </p>
                  )}

                  {/* 4. Attachment / Event Block if present */}
                  {post.attachment && (
                    <div className="p-3 rounded-xl border border-subtle bg-surface-muted/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6848] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-primary truncate">
                            {post.attachment.fileName || 'Attached Document'}
                          </div>
                          <div className="text-[11px] text-muted truncate">
                            {post.attachment.metaText || 'Official Document'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenPdfModal(post.attachment?.fileName || 'document.pdf')}
                        className="btn-secondary min-h-[36px] px-3 text-xs font-semibold shrink-0"
                      >
                        {post.attachment?.fileName?.toLowerCase().includes('notice') || post.attachment?.fileName?.toLowerCase().includes('circular') ? 'View Notice' : 'Open Document'}
                      </button>
                    </div>
                  )}

                  {/* 5. Streamlined Action Row (Compact Vote + Discuss + Save + Ask AI + Share) */}
                  <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2.5 pt-2.5 border-t border-subtle text-xs sm:text-[13px] font-medium text-secondary">
                    {/* Compact Voting */}
                    <div className="flex items-center bg-surface-muted rounded-lg p-0.5 border border-subtle">
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, 'up')}
                        aria-label="Upvote"
                        className={`min-h-[40px] min-w-[34px] sm:min-h-[34px] sm:min-w-[32px] flex items-center justify-center rounded-md transition cursor-pointer ${
                          post.hasUserUpvoted
                            ? 'text-[#FF6848] bg-surface font-bold shadow-2xs'
                            : 'text-muted hover:text-[#FF6848] hover:bg-surface'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span className={`px-1.5 text-xs sm:text-[13px] font-bold ${post.hasUserUpvoted ? 'text-[#FF6848]' : 'text-primary'}`}>
                        {post.upvotes}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, 'down')}
                        aria-label="Downvote"
                        className="min-h-[40px] min-w-[34px] sm:min-h-[34px] sm:min-w-[32px] flex items-center justify-center rounded-md transition text-muted hover:text-primary hover:bg-surface cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Secondary 1: Discuss */}
                    <button
                      type="button"
                      onClick={() => handleToggleComments(post.id)}
                      aria-label="Discussion"
                      className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-muted hover:text-primary transition cursor-pointer font-medium text-secondary"
                    >
                      <MessageSquare className="w-4 h-4 text-muted" />
                      <span>{post.commentsCount}</span>
                      <span className="hidden sm:inline">Discuss</span>
                    </button>

                    {/* Secondary 2: Save */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(post.id)}
                      aria-label={post.isSaved ? 'Remove from saved' : 'Save post'}
                      className={`min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                        post.isSaved
                          ? 'text-[#FF6848] bg-brand-surface'
                          : 'text-muted hover:bg-surface-muted hover:text-primary'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" fill={post.isSaved ? '#FF6848' : 'none'} />
                      <span className="hidden sm:inline">{post.isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    {/* Accent: Ask AI */}
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('open-campus-ai', {
                            detail: { prompt: `Summarize the campus discussion and key takeaways for: "${post.title}"` },
                          })
                        );
                      }}
                      aria-label="Ask Campus AI"
                      className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#FF6848] bg-brand-surface hover:bg-[#FF6848]/20 transition cursor-pointer font-semibold border border-brand-border"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-ai">Ask AI</span>
                    </button>

                    {/* Tertiary: Share */}
                    <button
                      type="button"
                      onClick={() => handleShare(post)}
                      aria-label="Share post"
                      className="btn-tertiary min-h-[44px] sm:min-h-[36px] px-2.5 text-muted hover:text-primary"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inline Discussion Drawer */}
                  {expandedCommentsPostId === post.id && (
                    <div className="pt-3 border-t border-subtle space-y-3">
                      <span className="text-xs font-semibold text-muted block">
                        Discussion ({commentsMap[post.id]?.length || post.commentsCount})
                      </span>

                      {/* Comments list */}
                      <div className="space-y-2">
                        {loadingComments ? (
                          <div className="flex items-center gap-2 text-xs text-muted py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6848]" />
                            <span>Loading discussion replies...</span>
                          </div>
                        ) : commentsMap[post.id]?.length === 0 ? (
                          <div className="text-xs text-muted py-1">
                            No comments yet. Start the conversation below.
                          </div>
                        ) : (
                          commentsMap[post.id]?.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-surface-muted border border-subtle space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between text-muted">
                                <span className="font-semibold text-primary">{c.author}</span>
                                <span>{c.timestamp}</span>
                              </div>
                              <p className="text-secondary">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Write a constructive reply..."
                          className="flex-1 px-3 py-1.5 text-xs bg-surface-muted border border-subtle rounded-lg outline-none focus:border-[#FF6848] focus:bg-surface text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentDraft.trim() || isSubmittingComment}
                          className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40 shrink-0"
                        >
                          {isSubmittingComment ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>

        {/* Secondary Right Rail (Subordinate exploration layer, collapses cleanly on smaller viewports) */}
        <aside className="hidden xl:block w-[290px] shrink-0 space-y-3.5">
          {/* 1. What's Next: Upcoming Deadlines & Logistics */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6848]" />
                <h3 className="font-bold text-sm text-primary font-brand">What’s next</h3>
              </div>
              <span className="text-xs text-muted">Key dates</span>
            </div>

            <div className="pt-2.5 divide-y divide-subtle space-y-2.5 text-xs sm:text-[13px]">
              <div className="pt-2 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-red-500">Exam Clash Window</span>
                  <span>This Week</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('notices')}
                  className="font-semibold text-xs sm:text-[13px] text-primary hover:text-[#FF6848] leading-snug text-left block transition cursor-pointer"
                >
                  Resolution window closes for overlapping semester examination slots
                </button>
                <div className="text-xs text-muted font-mono">Submit form before 23:59 IST</div>
              </div>

              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-[#FF6848]">Project Demo Review</span>
                  <span>Tomorrow</span>
                </div>
                <div className="font-semibold text-xs sm:text-[13px] text-primary leading-snug">
                  Collegiate Hackathon Milestone &amp; Jury Demo
                </div>
                <div className="text-xs text-muted">Seminar Hall A · 2:00 PM</div>
              </div>
            </div>
          </div>

          {/* 2. Active Spaces: 2-3 active student communities */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6848]" />
                <h3 className="font-bold text-sm text-primary font-brand">Active spaces</h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectView && onSelectView('communities')}
                className="text-xs text-[#FF6848] hover:underline font-semibold cursor-pointer"
              >
                Browse all
              </button>
            </div>

            <div className="pt-2.5 space-y-2.5">
              {[
                { name: 'Coding & Algorithms', activity: '42 members active', slug: 'coding_algorithms' },
                { name: 'Robotics Club', activity: 'Lab 402 updates · 1.4k members', slug: 'robotics-club' },
                { name: 'Hackathon Commons', activity: '18 discussions today', slug: 'hackathon_teams' },
              ].map((comm) => (
                <div key={comm.name} className="flex items-center justify-between py-0.5">
                  <div
                    onClick={() => {
                      if (onSelectView) {
                        if (comm.slug === 'robotics-club') onSelectView('robotics-club');
                        else onSelectView('communities');
                      }
                    }}
                    className="cursor-pointer truncate pr-2 group"
                  >
                    <div className="font-semibold text-xs sm:text-[13px] text-primary group-hover:text-[#FF6848] truncate transition">
                      {comm.name}
                    </div>
                    <div className="text-xs text-muted">{comm.activity}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleJoin(comm.name)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer ${
                      joinedCommunities[comm.name]
                        ? 'btn-secondary text-xs py-1 px-2.5'
                        : 'btn-primary text-xs py-1 px-2.5'
                    }`}
                  >
                    {joinedCommunities[comm.name] ? 'Joined' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
