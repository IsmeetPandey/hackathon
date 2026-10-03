'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostItem, UserProfile, CommentItem, ViewMode } from '@/types';
import {
  listPosts,
  votePost,
  toggleSavePost,
  listComments,
  addComment,
  listSavedPosts,
  listCommunities,
  joinCommunity,
  leaveCommunity,
  checkCommunityMembership,
} from '@/lib/dbService';
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
  AlertCircle,
  RefreshCw,
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
  if (!raw) return 'Campus Feed';
  if (raw.toLowerCase().includes('robotics')) return 'Robotics Club';
  if (raw.toLowerCase().includes('coding') || raw.toLowerCase().includes('algorithm')) return 'Coding & Algorithms';
  if (raw.toLowerCase().includes('hackathon')) return 'Hackathon Commons';
  if (raw.toLowerCase().includes('exam')) return 'Examination Cell';
  if (raw.toLowerCase().includes('placement')) return 'Career & Placements';
  if (raw.toLowerCase().includes('ieee')) return 'IEEE Student Branch';
  if (raw.toLowerCase().includes('all-campus')) return 'Campus Feed';
  return raw.replace(/^c\//, '').replace(/_/g, ' ');
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
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'hot' | 'new' | 'top'>('hot');

  // Comments state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [commentDraft, setCommentDraft] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Joined communities state
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({});
  const [sidebarCommunities, setSidebarCommunities] = useState<any[]>([]);

  const notify = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    if (showFeedbackToast) {
      showFeedbackToast(msg, type);
    }
  }, [showFeedbackToast]);

  // Load posts directly from Firestore
  const loadPostsFromDb = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (mode === 'saved') {
        if (!user.id) {
          setPosts([]);
          return;
        }
        const savedPostsList = await listSavedPosts(user.id);
        setPosts(savedPostsList);
      } else {
        const fetchedPosts = await listPosts({
          sort: activeFilter,
          currentUserId: user.id,
          limitCount: 40,
        });
        if (mode === 'activity') {
          const userActivity = fetchedPosts.filter(
            (p) =>
              p.author === user.username ||
              p.author === user.handle?.replace(/^u\//, '') ||
              p.hasUserUpvoted
          );
          setPosts(userActivity);
        } else {
          setPosts(fetchedPosts);
        }
      }
    } catch (err: any) {
      console.error('Firestore posts load error:', err);
      setFetchError(err?.message || 'Failed to connect to Firestore database.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, mode, user.id, user.username, user.handle]);

  useEffect(() => {
    let ignore = false;
    const fetchPosts = async () => {
      try {
        if (mode === 'saved') {
          if (!user.id) {
            if (!ignore) setPosts([]);
            return;
          }
          const savedPostsList = await listSavedPosts(user.id);
          if (!ignore) setPosts(savedPostsList);
        } else {
          const fetchedPosts = await listPosts({
            sort: activeFilter,
            currentUserId: user.id,
            limitCount: 40,
          });
          if (!ignore) {
            if (mode === 'activity') {
              const userActivity = fetchedPosts.filter(
                (p) =>
                  p.author === user.username ||
                  p.author === user.handle?.replace(/^u\//, '') ||
                  p.hasUserUpvoted
              );
              setPosts(userActivity);
            } else {
              setPosts(fetchedPosts);
            }
          }
        }
      } catch (err: any) {
        if (!ignore) {
          console.error('Firestore posts load error:', err);
          setFetchError(err?.message || 'Failed to connect to Firestore database.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    fetchPosts();
    return () => {
      ignore = true;
    };
  }, [activeFilter, mode, user.id, user.username, user.handle]);

  // Load sidebar communities and user memberships
  useEffect(() => {
    let ignore = false;
    async function loadComms() {
      try {
        const list = await listCommunities();
        if (!ignore) {
          setSidebarCommunities(list.slice(0, 4));
          if (user.id) {
            const memberStatus: Record<string, boolean> = {};
            for (const c of list.slice(0, 4)) {
              const isMem = await checkCommunityMembership(c.id, user.id);
              memberStatus[c.name] = isMem;
            }
            setJoinedCommunities(memberStatus);
          }
        }
      } catch (err) {
        console.warn('Error loading communities for sidebar:', err);
      }
    }
    loadComms();
    return () => {
      ignore = true;
    };
  }, [user.id]);

  // Handle voting via Firestore
  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!user.id) {
      notify('Please sign in to upvote posts', 'info');
      return;
    }

    // Optimistic UI update
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
      const result = await votePost(id, user.id, type);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                upvotes: result.newUpvotes,
                hasUserUpvoted: result.userVote === 'up',
                hasUserDownvoted: result.userVote === 'down',
              }
            : p
        )
      );
    } catch (err) {
      console.error('Vote sync error in Firestore:', err);
      loadPostsFromDb();
    }
  };

  // Handle save post via Firestore
  const handleToggleSave = async (id: string) => {
    if (!user.id) {
      notify('Please sign in to bookmark posts', 'info');
      return;
    }

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

    try {
      const isSaved = await toggleSavePost(user.id, id);
      notify(isSaved ? 'Saved to Your Space' : 'Removed from saved', 'info');
    } catch (err) {
      console.error('Save toggle error:', err);
      notify('Failed to update bookmark', 'info');
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

  // Toggle comments via Firestore
  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }

    setExpandedCommentsPostId(postId);

    if (!commentsMap[postId]) {
      setLoadingComments(true);
      try {
        const comments = await listComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.warn('Failed to load comments from Firestore:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Add comment via Firestore
  const handleAddComment = async (postId: string) => {
    if (!commentDraft.trim() || isSubmittingComment) return;
    if (!user.id) {
      notify('Please sign in to reply', 'info');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(postId, {
        authorId: user.id,
        author: user.username || 'Campus Student',
        authorRole: user.role || 'Student',
        content: commentDraft.trim(),
      });

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentDraft('');
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
      notify('Reply published', 'success');
    } catch (err) {
      console.error('Failed to post comment to Firestore:', err);
      notify('Failed to post reply', 'info');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Toggle Community Join via Firestore
  const handleToggleJoin = async (communityName: string, communityId?: string) => {
    if (!user.id) {
      notify('Please sign in to join communities', 'info');
      return;
    }

    const current = !!joinedCommunities[communityName];
    setJoinedCommunities((prev) => ({ ...prev, [communityName]: !current }));
    notify(!current ? `Joined ${communityName}` : `Left ${communityName}`, 'info');

    try {
      const commId = communityId || communityName.toLowerCase().replace(/\s+/g, '-');
      if (!current) {
        await joinCommunity(commId, user.id, user.handle);
      } else {
        await leaveCommunity(commId, user.id);
      }
    } catch (err) {
      console.warn('Join sync error in Firestore:', err);
    }
  };

  // Merge newly created post if provided
  const mergedPosts =
    newCreatedPost && !posts.some((p) => p.id === newCreatedPost.id)
      ? [newCreatedPost, ...posts]
      : posts;

  return (
    <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col xl:flex-row gap-6 justify-center items-start">
        {/* Main Feed Column */}
        <main className="w-full xl:max-w-[760px] flex-1 space-y-4">
          {/* CAMPUS PULSE */}
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
                  ? 'Posts you bookmarked in Firestore'
                  : mode === 'activity'
                  ? 'Discussions you authored or upvoted'
                  : 'Live announcements, projects, and discussions'}
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
                className="btn-primary min-h-[40px] px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm shadow-[0_2px_8px_rgba(255,104,72,0.25)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Post</span>
              </button>
            </div>
          </div>

          {/* Error State */}
          {fetchError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs sm:text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={loadPostsFromDb}
                className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="surface-elevated rounded-2xl p-5 border border-subtle animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-3.5 bg-surface-muted rounded" />
                    <div className="w-16 h-3.5 bg-surface-muted rounded" />
                  </div>
                  <div className="w-3/4 h-5 bg-surface-muted rounded" />
                  <div className="w-full h-12 bg-surface-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && mergedPosts.length === 0 && (
            <div className="surface-elevated rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-2xs border border-subtle">
              <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center mx-auto text-muted">
                {mode === 'saved' ? <Bookmark className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-semibold text-primary">
                {mode === 'saved' ? 'No saved posts yet' : 'No posts yet'}
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {mode === 'saved'
                  ? 'Click the bookmark icon on any campus post to save it to your personal space.'
                  : 'Be the first member to publish a notice, project update, or discussion topic!'}
              </p>
              <button
                type="button"
                onClick={onOpenCreatePost}
                className="btn-primary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Post</span>
              </button>
            </div>
          )}

          {/* Post Items */}
          {!isLoading &&
            mergedPosts.map((post) => {
              const displayCommunity = cleanCommunityTitle(post.community);

              return (
                <article
                  key={post.id}
                  className="surface-elevated rounded-2xl p-4 sm:p-5 transition space-y-3 border border-subtle"
                >
                  {/* Community + Time + Author */}
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
                      <span className="hidden sm:inline text-muted font-medium">
                        by {post.author.replace(/^u\//, '')}
                      </span>
                    </div>

                    {/* Contextual Pinned Badge */}
                    {post.pinned && (
                      <span className="text-[11px] font-bold text-[#FF6848] bg-brand-surface px-2 py-0.5 rounded border border-brand-border">
                        {post.pinnedLabel || 'OFFICIAL'}
                      </span>
                    )}
                  </div>

                  {/* Post Title */}
                  <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
                    {post.title}
                  </h2>

                  {/* Body */}
                  {post.content && (
                    <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line line-clamp-4 sm:line-clamp-none font-medium">
                      {post.content}
                    </p>
                  )}

                  {/* Attachment Block if present */}
                  {post.attachment && (
                    <div className="p-3 rounded-xl border border-subtle bg-surface-muted/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6848] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-primary truncate">
                            {post.attachment.fileName || 'Attached Document'}
                          </div>
                          <div className="text-[11px] text-muted truncate">
                            {post.attachment.metaText || post.attachment.fileSize || 'Verified Document'}
                          </div>
                        </div>
                      </div>

                      {post.attachment.fileName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (post.attachment?.imageUrl) {
                              window.open(post.attachment.imageUrl, '_blank');
                            } else {
                              onOpenPdfModal(post.attachment!.fileName || 'document.pdf');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-brand-surface text-[#FF6848] border border-subtle font-bold text-xs shrink-0 transition cursor-pointer"
                        >
                          View Document
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions Footer: Upvote, Comments, Share, Save */}
                  <div className="flex items-center justify-between pt-2 border-t border-subtle text-xs">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Upvote Pill */}
                      <div className="flex items-center bg-surface-muted border border-subtle rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => handleVote(post.id, 'up')}
                          aria-label="Upvote post"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            post.hasUserUpvoted
                              ? 'text-[#FF6848] bg-brand-surface font-bold'
                              : 'text-muted hover:text-primary'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span
                          className={`px-1.5 text-xs font-bold ${
                            post.hasUserUpvoted
                              ? 'text-[#FF6848]'
                              : post.hasUserDownvoted
                              ? 'text-blue-500'
                              : 'text-primary'
                          }`}
                        >
                          {post.upvotes}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleVote(post.id, 'down')}
                          aria-label="Downvote post"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            post.hasUserDownvoted
                              ? 'text-blue-500 bg-blue-500/10 font-bold'
                              : 'text-muted hover:text-primary'
                          }`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Comments Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleComments(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle transition cursor-pointer ${
                          expandedCommentsPostId === post.id
                            ? 'bg-surface text-[#FF6848] border-brand-border font-bold'
                            : 'bg-surface-muted text-secondary hover:text-primary'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-semibold">{post.commentsCount}</span>
                        <span className="hidden sm:inline">Replies</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Share */}
                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        title="Copy link"
                        className="p-2 text-muted hover:text-primary hover:bg-surface-muted rounded-xl transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Bookmark Save */}
                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        title={post.isSaved ? 'Remove bookmark' : 'Bookmark post'}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          post.isSaved
                            ? 'text-[#FF6848] bg-brand-surface'
                            : 'text-muted hover:text-primary hover:bg-surface-muted'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Comments Panel */}
                  {expandedCommentsPostId === post.id && (
                    <div className="pt-3 space-y-3 border-t border-subtle animate-in fade-in duration-150">
                      {/* Comments List */}
                      {loadingComments ? (
                        <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6848]" />
                          <span>Loading discussion thread from Firestore...</span>
                        </div>
                      ) : (commentsMap[post.id] || []).length === 0 ? (
                        <p className="text-xs text-muted italic py-2">
                          No replies yet. Be the first to leave a comment!
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {(commentsMap[post.id] || []).map((comm) => (
                            <div
                              key={comm.id}
                              className="p-2.5 rounded-xl bg-surface-muted border border-subtle text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-muted">
                                <span className="font-bold text-primary">{comm.author}</span>
                                <span>{comm.timestamp}</span>
                              </div>
                              <p className="text-secondary leading-relaxed font-medium">
                                {comm.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Write a constructive reply..."
                          className="flex-1 px-3 py-2 text-xs bg-surface-muted border border-subtle rounded-lg outline-none focus:border-[#FF6848] focus:bg-surface text-primary font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentDraft.trim() || isSubmittingComment}
                          className="btn-primary px-3 py-2 text-xs disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1.5"
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
            })}
        </main>

        {/* Right Sidebar Rail */}
        <aside className="hidden xl:block w-[290px] shrink-0 space-y-3.5">
          {/* Upcoming Key Dates */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs border border-subtle">
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

          {/* Active Spaces */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs border border-subtle">
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
              {sidebarCommunities.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between py-0.5">
                  <div
                    onClick={() => {
                      if (onSelectView) {
                        if (comm.slug === 'robotics-club') onSelectView('robotics-club');
                        else onSelectView('communities');
                      }
                    }}
                    className="cursor-pointer truncate pr-2 group min-w-0"
                  >
                    <div className="font-semibold text-xs sm:text-[13px] text-primary group-hover:text-[#FF6848] truncate transition">
                      {comm.name}
                    </div>
                    <div className="text-[11px] text-muted">{comm.memberCount} members</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleJoin(comm.name, comm.id)}
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
