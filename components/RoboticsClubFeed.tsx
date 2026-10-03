'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostItem, UserProfile } from '@/types';
import {
  listPosts,
  votePost,
  joinCommunity,
  leaveCommunity,
  checkCommunityMembership,
} from '@/lib/dbService';
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  FileText,
  Bot,
  MapPin,
  Clock,
  Check,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface RoboticsClubFeedProps {
  user: UserProfile;
  onOpenCreatePost: () => void;
  onOpenPdfModal: (fileName: string) => void;
  onOpenGCodeModal: () => void;
  onOpenRsvpModal: (title: string) => void;
}

export default function RoboticsClubFeed({
  user,
  onOpenCreatePost,
  onOpenPdfModal,
  onOpenGCodeModal,
  onOpenRsvpModal,
}: RoboticsClubFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'events'>('posts');
  const [isJoined, setIsJoined] = useState(true);
  const [memberCount, setMemberCount] = useState(1420);
  const [hasRsvpdWorkshop, setHasRsvpdWorkshop] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const commPosts = await listPosts({
          communitySlug: 'robotics-club',
          currentUserId: user.id,
          limitCount: 20,
        });
        if (!ignore) setPosts(commPosts);

        if (user.id) {
          const isMem = await checkCommunityMembership('robotics-club', user.id);
          if (!ignore) setIsJoined(isMem);
        }
      } catch (err) {
        console.error('Error loading robotics posts from Firestore:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user.id]);

  const toggleJoin = async () => {
    if (!user.id) return;
    const nextState = !isJoined;
    setIsJoined(nextState);
    setMemberCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextState) {
        await joinCommunity('robotics-club', user.id, user.handle);
      } else {
        await leaveCommunity('robotics-club', user.id);
      }
    } catch (err) {
      console.error('Join error:', err);
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!user.id) return;
    try {
      const res = await votePost(id, user.id, type);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                upvotes: res.newUpvotes,
                hasUserUpvoted: res.userVote === 'up',
                hasUserDownvoted: res.userVote === 'down',
              }
            : p
        )
      );
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* 1. Community Header Banner */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-6 border border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-[#FF6848] shrink-0 shadow-2xs font-bold text-xl font-brand">
              <Bot className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
                  Robotics Club
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-brand-surface text-[#FF6848] rounded border border-brand-border">
                  TIER 1 · MAKERSPACE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secondary mt-0.5 line-clamp-1 font-medium">
                Hardware hacking, ROS2 navigation, 3D printing, and mechatronic systems
              </p>
              <div className="flex items-center gap-2 text-xs text-muted mt-1 font-semibold">
                <span>{memberCount.toLocaleString()} Members</span>
                <span>·</span>
                <span>Makerspace Lab 402</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={toggleJoin}
              className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer ${
                isJoined ? 'btn-secondary py-2 px-4' : 'btn-primary py-2 px-4'
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
                  <span>Join Club</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary min-h-[40px] px-4 rounded-xl text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 flex-1 sm:flex-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Makerspace Signature Workshop Card */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-5 border border-brand-border/40 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6848]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6848] font-brand">
              Upcoming Hands-on Workshop
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
            Open Registration
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary">
              Autonomous Robotics &amp; ROS2 Navigation Stack Deep-Dive
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1 max-w-2xl font-medium">
              Learn SLAM map generation, LIDAR sensor fusion, and real-time obstacle avoidance on differential-drive robots.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted mt-2 font-semibold flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF6848]" />
                <span>Tomorrow · 4:00 PM – 6:30 PM</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF6848]" />
                <span>Makerspace Lab 402</span>
              </span>
              <span className="text-[#FF6848] font-bold">32 / 40 Seats Reserved</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasRsvpdWorkshop(true);
              onOpenRsvpModal('Autonomous Robotics & ROS2 Workshop');
            }}
            className={`min-h-[38px] px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              hasRsvpdWorkshop ? 'btn-secondary py-2 px-4' : 'btn-primary py-2 px-4'
            }`}
          >
            {hasRsvpdWorkshop ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>RSVP Confirmed</span>
              </>
            ) : (
              <span>Reserve Seat</span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Club Discussions from Firestore */}
      <div className="space-y-3.5">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-brand">
          Lab Posts &amp; Project Updates
        </h2>

        {isLoading && (
          <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#FF6848]" />
            <span>Loading club posts from Firestore...</span>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="surface-elevated rounded-2xl p-8 text-center space-y-3 border border-subtle">
            <Bot className="w-10 h-10 text-muted mx-auto" />
            <h3 className="text-sm font-bold text-primary">No posts yet in Robotics Club</h3>
            <p className="text-xs text-muted font-medium">
              Share a CAD design, ROS code snippet, or lab update!
            </p>
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Create Post
            </button>
          </div>
        )}

        {!isLoading &&
          posts.map((post) => (
            <article
              key={post.id}
              className="surface-elevated rounded-2xl p-4 sm:p-5 space-y-3 border border-subtle shadow-2xs"
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
                      {post.attachment.fileName || 'Attached Project File'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (post.attachment?.fileName?.endsWith('.gcode')) {
                        onOpenGCodeModal();
                      } else {
                        onOpenPdfModal(post.attachment!.fileName || 'project_blueprint.pdf');
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-[#FF6848] bg-surface rounded-lg border border-subtle hover:bg-brand-surface transition cursor-pointer"
                  >
                    Inspect
                  </button>
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
          ))}
      </div>
    </div>
  );
}
