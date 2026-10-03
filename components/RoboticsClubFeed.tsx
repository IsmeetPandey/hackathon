'use client';

import React, { useState } from 'react';
import { PostItem, UserProfile } from '@/types';
import { ROBOTICS_POSTS } from '@/lib/mockData';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RoboticsClubFeedProps {
  user: UserProfile;
  onOpenCreatePost: () => void;
  onOpenPdfModal: (fileName: string) => void;
  onOpenGCodeModal: () => void;
  onOpenRsvpModal: (title: string) => void;
}

export default function RoboticsClubFeed({
  onOpenCreatePost,
  onOpenPdfModal,
  onOpenGCodeModal,
  onOpenRsvpModal,
}: RoboticsClubFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(ROBOTICS_POSTS);
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'events'>('posts');
  const [isJoined, setIsJoined] = useState(true);
  const [memberCount, setMemberCount] = useState(1420);
  const [hasRsvpdWorkshop, setHasRsvpdWorkshop] = useState(false);
  const [showLabDetails, setShowLabDetails] = useState(false);

  const toggleJoin = () => {
    if (isJoined) {
      setIsJoined(false);
      setMemberCount((prev) => prev - 1);
    } else {
      setIsJoined(true);
      setMemberCount((prev) => prev + 1);
    }
  };

  const handleVote = (id: string, type: 'up' | 'down') => {
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
  };

  return (
    <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* 1. Community Header Banner */}
      <div className="surface-elevated rounded-2xl p-4 sm:p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-[#FF6848] shrink-0 shadow-[0_2px_10px_rgba(255,104,72,0.25)]">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-brand text-xl sm:text-2xl font-bold text-primary tracking-tight">
                  Robotics Club
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-surface text-[#FF6848] rounded-md border border-brand-border">
                  Student Club
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secondary mt-0.5 line-clamp-2 sm:line-clamp-none max-w-xl font-medium">
                Autonomous rovers, hardware hacking, ROS 2 navigation stacks, and combat robotics.
              </p>
              <div className="flex items-center gap-2.5 text-xs text-muted mt-1.5 font-semibold">
                <span><strong className="text-primary">{memberCount.toLocaleString()}</strong> members</span>
                <span>·</span>
                <span>Collegiate Society</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={toggleJoin}
              className="btn-secondary flex-1 sm:flex-none min-h-[40px] px-4 text-xs font-bold"
            >
              {isJoined ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Joined</span>
                </>
              ) : (
                <span>Join Club</span>
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

        {/* Tab Navigation: Posts, Projects, Events */}
        <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-subtle overflow-x-auto pb-0.5 bg-surface-muted p-1 rounded-xl border">
          {[
            { id: 'posts', label: 'Discussions' },
            { id: 'projects', label: 'Projects (7)' },
            { id: 'events', label: 'Workshops' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`filter-segment ${
                activeTab === tab.id ? 'filter-segment-active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile collapsible Lab details section */}
      <div className="xl:hidden surface-elevated rounded-2xl mb-4 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowLabDetails(!showLabDetails)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-secondary hover:bg-surface-muted transition cursor-pointer min-h-[44px]"
        >
          <span>Lab 402 Machine Queue &amp; Status</span>
          {showLabDetails ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </button>

        {showLabDetails && (
          <div className="p-4 pt-0 space-y-2 border-t border-subtle text-xs">
            <div className="p-2.5 bg-surface-muted rounded-xl border border-subtle flex items-center justify-between">
              <div>
                <div className="font-bold text-primary">Prusa MK4 #01 (Printing)</div>
                <div className="text-[11px] text-muted">1h 14m remaining</div>
              </div>
              <span className="text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold">Busy</span>
            </div>
            <div className="p-2.5 bg-surface-muted rounded-xl border border-subtle flex items-center justify-between">
              <div>
                <div className="font-bold text-primary">Prusa MK4 #02 (Idle)</div>
                <div className="text-[11px] text-muted">Bed Temp: 23°C (Ready)</div>
              </div>
              <button
                type="button"
                onClick={onOpenGCodeModal}
                className="text-[11px] text-[#FF6848] font-bold hover:underline"
              >
                Submit Job
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-6 justify-center items-start">
        {/* Main Feed Column */}
        <main className="w-full xl:max-w-[760px] flex-1 space-y-4">
          {activeTab === 'posts' && (
            posts.map((post) => (
              <article
                key={post.id}
                className="surface-elevated rounded-2xl p-4 sm:p-5 transition space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary">{post.author.replace(/^u\//, '')}</span>
                    <span>·</span>
                    <span>{post.timestamp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('open-campus-ai', {
                          detail: { prompt: `Summarize the robotics discussion about: "${post.title}"` },
                        })
                      );
                    }}
                    className="text-[11px] text-[#FF6848] bg-brand-surface px-2 py-0.5 rounded border border-brand-border flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="font-ai">Ask AI</span>
                  </button>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
                  {post.title}
                </h2>

                <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line line-clamp-4 sm:line-clamp-none font-medium">
                  {post.content}
                </p>

                {post.attachment && (
                  <div className="p-3 bg-surface-muted/80 border border-subtle rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6848] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-primary truncate">
                          {post.attachment.metaText || post.attachment.fileName || 'Telemetry File'}
                        </div>
                        <div className="text-[11px] text-muted">Hardware Bench Record</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPdfModal('circular_endsem_schedule_latest.pdf')}
                      className="btn-secondary px-3 py-1 text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      Inspect
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between sm:justify-start gap-3 pt-2.5 border-t border-subtle text-xs font-semibold text-secondary">
                  <div className="flex items-center bg-surface-muted rounded-lg p-0.5 border border-subtle">
                    <button
                      type="button"
                      onClick={() => handleVote(post.id, 'up')}
                      aria-label="Upvote"
                      className={`min-h-[36px] min-w-[32px] sm:min-h-[38px] sm:min-w-[36px] flex items-center justify-center rounded-md transition ${
                        post.hasUserUpvoted ? 'text-[#FF6848] bg-surface font-bold shadow-2xs' : 'text-muted hover:text-[#FF6848] hover:bg-surface'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className={`px-1.5 text-xs font-bold ${post.hasUserUpvoted ? 'text-[#FF6848]' : 'text-primary'}`}>{post.upvotes}</span>
                    <button
                      type="button"
                      onClick={() => handleVote(post.id, 'down')}
                      aria-label="Downvote"
                      className="min-h-[36px] min-w-[32px] sm:min-h-[38px] sm:min-w-[36px] flex items-center justify-center rounded-md transition text-muted hover:text-primary hover:bg-surface"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-muted hover:text-primary transition font-bold"
                  >
                    <MessageSquare className="w-4 h-4 text-muted" />
                    <span>{post.commentsCount} Comments</span>
                  </button>
                </div>
              </article>
            ))
          )}

          {activeTab === 'projects' && (
            <div className="space-y-3">
              {[
                { name: 'Project Cerberus', desc: '12-DoF Quadruped Robot with MPC Stair Climbing', status: 'Testing Phase', leads: 'Tanmay & Arya' },
                { name: 'Autonomous Rover Mk.IV', desc: 'ROS 2 Nav2 GPS-denied navigation across SAC complex', status: 'Active Sprint', leads: 'Rohan (FSAE)' },
                { name: 'RoboWars 30kg Combat Bot', desc: 'Hardox 500 armor drum spinner for TechFest collegiate finals', status: 'Fabrication', leads: 'Nikhil P.' },
              ].map((proj, idx) => (
                <div key={idx} className="surface-elevated rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-brand font-bold text-sm sm:text-base text-primary">{proj.name}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary font-medium">{proj.desc}</p>
                  <div className="text-xs text-muted font-semibold">Project Leads: {proj.leads}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="surface-elevated rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border flex flex-col items-center justify-center shrink-0 text-[#FF6848]">
                  <span className="text-[10px] font-bold uppercase leading-none">NOV</span>
                  <span className="text-base font-extrabold leading-none mt-0.5">26</span>
                </div>
                <div>
                  <h3 className="font-brand font-bold text-base text-primary">ROS2 Navigation Stack Workshop</h3>
                  <p className="text-xs text-secondary mt-1 font-medium">
                    Hands-on sensor fusion with EKF, costmap generation, and deploying path planners to physical bots.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted mt-2 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>10:00 AM – 1:30 PM</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Makerspace Lab 402</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between">
                <span className="text-xs text-muted font-semibold">32 / 40 seats filled</span>
                <button
                  type="button"
                  onClick={() => {
                    setHasRsvpdWorkshop(!hasRsvpdWorkshop);
                    if (!hasRsvpdWorkshop) onOpenRsvpModal('ROS2 Navigation Stack Workshop');
                  }}
                  className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    hasRsvpdWorkshop
                      ? 'btn-secondary'
                      : 'btn-primary shadow-2xs'
                  }`}
                >
                  {hasRsvpdWorkshop ? 'RSVP Confirmed' : 'RSVP for Workshop'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 3. Secondary Side Rail on Desktop */}
        <aside className="hidden xl:block w-[300px] shrink-0 space-y-4">
          {/* About Club */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted font-brand">About Space</h3>
            <p className="text-xs text-secondary leading-relaxed font-medium">
              Official collegiate society for autonomous ground robotics, aerial systems, and mechanical rapid prototyping.
            </p>
            <div className="space-y-1.5 text-xs text-muted pt-1 font-medium">
              <div className="flex items-center justify-between">
                <span>Lab Location</span>
                <span className="font-bold text-primary">Block 4, Lab 402</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Faculty Advisor</span>
                <span className="font-bold text-primary">Prof. S. R. Mukherjee</span>
              </div>
            </div>
          </div>

          {/* Machine & 3D Print Queue */}
          <div className="surface-elevated rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted font-brand">Lab 402 Queue</h3>
              <button
                type="button"
                onClick={onOpenGCodeModal}
                className="text-xs font-bold text-[#FF6848] hover:underline cursor-pointer"
              >
                Submit Job
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-surface-muted rounded-xl border border-subtle space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">Prusa MK4 #01</span>
                  <span className="text-[11px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">Busy</span>
                </div>
                <div className="text-[11px] text-muted">Chassis_Mount_v4.stl · 1h 14m left</div>
              </div>

              <div className="p-2.5 bg-surface-muted rounded-xl border border-subtle space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">Prusa MK4 #02</span>
                  <span className="text-[11px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">Available</span>
                </div>
                <div className="text-[11px] text-muted">Bed Temp: 23°C (Idle)</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
