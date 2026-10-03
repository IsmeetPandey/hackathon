'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, PostItem, Community } from '@/types';
import {
  getCommunityBySlug,
  listPosts,
  joinCommunity,
  leaveCommunity,
  checkCommunityMembership,
  votePost,
} from '@/lib/dbService';
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
  Loader2,
  AlertCircle,
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
  user,
  onOpenCreatePost,
  onOpenPdfModal,
  onBack,
}: CommunityDetailViewProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const comm = await getCommunityBySlug(communitySlug);
        if (ignore) return;
        if (!comm) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        setCommunity(comm);

        if (user.id) {
          const joined = await checkCommunityMembership(comm.id, user.id);
          if (!ignore) setIsJoined(joined);
        }

        const commPosts = await listPosts({
          communitySlug: comm.slug,
          currentUserId: user.id,
          limitCount: 25,
        });
        if (!ignore) setPosts(commPosts);
      } catch (err) {
        console.error('Error loading community from Firestore:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [communitySlug, user.id]);

  const handleToggleJoin = async () => {
    if (!community) return;
    if (!user.id) {
      alert('Please sign in to join spaces.');
      return;
    }

    const nextState = !isJoined;
    setIsJoined(nextState);

    try {
      if (nextState) {
        await joinCommunity(community.id, user.id, user.handle);
        setCommunity((prev) => (prev ? { ...prev, memberCount: prev.memberCount + 1 } : null));
      } else {
        await leaveCommunity(community.id, user.id);
        setCommunity((prev) => (prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : null));
      }
    } catch (err) {
      console.error('Error toggling community membership:', err);
      setIsJoined(!nextState);
    }
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
    if (!user.id) return;
    try {
      const result = await votePost(postId, user.id, type);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
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
      console.error('Vote error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1040px] mx-auto px-3 sm:px-6 py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#FF6848]" />
        <span>Loading space details from Firestore...</span>
      </div>
    );
  }

  if (notFound || !community) {
    return (
      <div className="max-w-[1040px] mx-auto px-3 sm:px-6 py-12 text-center space-y-4">
        <div className="surface-elevated rounded-2xl p-8 max-w-md mx-auto space-y-3 border border-subtle">
          <AlertCircle className="w-10 h-10 text-muted mx-auto" />
          <h2 className="text-lg font-bold text-primary">Community Not Found</h2>
          <p className="text-xs text-muted font-medium">
            The space &quot;{communitySlug}&quot; could not be located in the Firestore database.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Back to Communities Directory
          </button>
        </div>
      </div>
    );
  }

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
      <div className="surface-elevated rounded-2xl p-4 sm:p-5 border border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-[#FF6848] font-bold text-xl shrink-0 font-brand">
              {community.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
                  {community.name}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-surface text-[#FF6848] rounded-md border border-brand-border capitalize">
                  {community.category || 'Community'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secondary mt-1 max-w-xl leading-relaxed font-medium">
                {community.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted mt-1.5 font-semibold">
                <span>
                  <strong className="text-primary">{community.memberCount.toLocaleString()}</strong> members
                </span>
                <span>·</span>
                <span>c/{community.slug}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleToggleJoin}
              className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer ${
                isJoined
                  ? 'btn-secondary text-xs py-2 px-4'
                  : 'btn-primary text-xs py-2 px-4'
              }`}
            >
              {isJoined ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Joined</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join Space</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary min-h-[40px] px-4 rounded-xl text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post to Space</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Posts */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-primary uppercase tracking-wider font-brand">
            Discussions &amp; Updates ({posts.length})
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="surface-elevated rounded-2xl p-8 text-center space-y-3 border border-subtle">
            <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center mx-auto text-muted">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-primary">No discussions in this space yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto font-medium">
              Be the first to publish a project update, question, or resource to {community.name}!
            </p>
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Post</span>
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="surface-elevated rounded-2xl p-4 sm:p-5 space-y-3 border border-subtle"
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-primary">{post.author}</span>
                  <span>·</span>
                  <span>{post.timestamp}</span>
                </div>
                {post.pinned && (
                  <span className="text-[10px] font-bold text-[#FF6848] bg-brand-surface px-1.5 py-0.5 rounded border border-brand-border">
                    PINNED
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-primary tracking-tight">{post.title}</h3>
              {post.content && (
                <p className="text-xs sm:text-sm text-secondary leading-relaxed font-medium">
                  {post.content}
                </p>
              )}

              {post.attachment && (
                <div className="p-3 rounded-xl border border-subtle bg-surface-muted/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#FF6848] shrink-0" />
                    <span className="font-bold text-primary truncate">
                      {post.attachment.fileName || 'Attached Document'}
                    </span>
                  </div>
                  {post.attachment.fileName && (
                    <button
                      type="button"
                      onClick={() => onOpenPdfModal(post.attachment!.fileName || 'document.pdf')}
                      className="px-2.5 py-1 text-xs font-bold text-[#FF6848] bg-surface rounded-lg border border-subtle hover:bg-brand-surface transition cursor-pointer"
                    >
                      View
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-subtle text-xs">
                <div className="flex items-center bg-surface-muted border border-subtle rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => handleVote(post.id, 'up')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      post.hasUserUpvoted ? 'text-[#FF6848] bg-brand-surface font-bold' : 'text-muted hover:text-primary'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-bold text-primary">{post.upvotes}</span>
                  <button
                    type="button"
                    onClick={() => handleVote(post.id, 'down')}
                    className="p-1.5 rounded-lg text-muted hover:text-primary transition cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-muted font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.commentsCount} replies</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
