export type ViewMode =
  | 'all-campus'
  | 'notices'
  | 'communities'
  | 'robotics-club'
  | 'ingestion-desk'
  | 'login-sso'
  | 'saved'
  | 'my-activity'
  | 'profile'
  | 'settings'
  | 'messages';

export type UserRole = 'student' | 'faculty' | 'moderator';

export interface UserProfile {
  id?: string;
  username: string;
  handle: string;
  email?: string;
  avatarUrl: string;
  karma: string;
  role: string;
  department: string;
  rollNumber?: string;
  isLoggedIn: boolean;
  createdAt?: string;
}

export interface PostAttachment {
  type: 'pdf' | 'excel' | 'image' | 'telemetry' | 'workshop' | 'poll' | 'hardware' | 'event';
  fileName?: string;
  fileSize?: string;
  metaText?: string;
  verifiedLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
  workshopDate?: { month: string; day: string };
  workshopTime?: string;
  workshopLocation?: string;
  workshopSeats?: { total: number; filled: number };
  canLoad?: string;
  linkType?: string;
  telemetryStats?: { label: string; val: string }[];
  pollOptions?: { id: string; text: string; votes: number; percentage: number }[];
  pollTotalVotes?: number;
  price?: string;
}

export interface PostItem {
  id: string;
  community: string;
  communityPrefix: string;
  communityIconBg?: string;
  author: string;
  authorRole?: string;
  authorBadge?: string;
  authorBadgeType?: 'mod' | 'official' | 'tech' | 'student' | 'alumni';
  timestamp: string;
  createdAt?: string;
  pinned?: boolean;
  pinnedLabel?: string;
  title: string;
  content: string;
  flairs?: { label: string; bg: string; text: string; border?: string }[];
  categoryTier?: string;
  docCode?: string;
  upvotes: number;
  commentsCount: number;
  hasUserUpvoted?: boolean;
  hasUserDownvoted?: boolean;
  isSaved?: boolean;
  attachment?: PostAttachment;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  prefix: string;
  title: string;
  description: string;
  memberCount: number;
  category: 'academic' | 'club' | 'commons' | 'official';
  tier?: string;
  iconBg?: string;
  createdAt: string;
}

export type VoteType = 'up' | 'down';

export interface PostVote {
  id: string;
  postId: string;
  userHandle: string;
  voteType: VoteType;
  createdAt: string;
}

export interface SavedPost {
  id: string;
  postId: string;
  userHandle: string;
  createdAt: string;
}

export interface CommunityMembership {
  id: string;
  communityId: string;
  communitySlug: string;
  userHandle: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  author: string;
  authorRole?: string;
  content: string;
  timestamp: string;
  createdAt: string;
  upvotes?: number;
}

export interface CircularNoticeItem {
  id: string;
  docCode: string;
  title: string;
  source: string;
  officerName: string;
  category: string;
  documentDate: string;
  summaryBullets: string[];
  extractedText?: string;
  fileName?: string;
  fileSize?: string;
  publishedAt: string;
  status: 'draft' | 'staged' | 'broadcasted';
  targetAudience: string;
  channels: string[];
}

export interface QueueItem {
  id: string;
  name: string;
  status: 'BUSY' | 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  statusClass: string;
  progress?: number;
  fileName?: string;
  timeLeft?: string;
  details?: string;
  actionText?: string;
}

export interface CourseImpactItem {
  code: string;
  title: string;
  degreeSem: string;
  examDate: string;
  cohort: string;
}

export interface CampusPulseItem {
  id: string;
  type: 'notice' | 'event' | 'community';
  title: string;
  metadata: string;
  summary: string;
  actionLabel: string;
  targetView: ViewMode;
  targetData?: string;
  tagText: string;
}

