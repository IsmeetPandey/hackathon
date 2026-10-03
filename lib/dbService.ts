import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import {
  PostItem,
  CircularNoticeItem,
  CommentItem,
  UserProfile,
  Community,
  PostAttachment,
} from '@/types';

// Helper to convert Firestore Timestamp or string to formatted display timestamp
export function formatTimestamp(val: any): { display: string; iso: string } {
  if (!val) {
    return { display: 'Just now', iso: new Date().toISOString() };
  }
  let date: Date;
  if (val instanceof Timestamp) {
    date = val.toDate();
  } else if (typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else if (val.seconds) {
    date = new Date(val.seconds * 1000);
  } else {
    date = new Date();
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let display: string;
  if (diffSec < 45) {
    display = 'Just now';
  } else if (diffMin < 60) {
    display = `${diffMin}m ago`;
  } else if (diffHour < 24) {
    display = `${diffHour}h ago`;
  } else if (diffDay < 7) {
    display = `${diffDay}d ago`;
  } else {
    display = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  return { display, iso: date.toISOString() };
}

// ============================================================================
// 1. USERS SERVICE
// ============================================================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    return null;
  }
  const data = userDoc.data();
  const { iso } = formatTimestamp(data.createdAt);
  return {
    id: uid,
    username: data.displayName || data.username || 'Campus Student',
    handle: data.handle || `u/${(data.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
    email: data.email || '',
    avatarUrl: data.avatarUrl || data.photoURL || '',
    karma: String(data.karma ?? 100),
    role: data.role || 'Student',
    department: data.department || 'Computer Science & Engineering',
    rollNumber: data.rollNumber || '',
    isLoggedIn: true,
    createdAt: iso,
  };
}

export async function createUserProfile(uid: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const handle = profile.handle || `u/${(profile.username || 'student').toLowerCase().replace(/\s+/g, '_')}`;
  const newProfile = {
    displayName: profile.username || 'Campus Student',
    handle,
    email: profile.email || '',
    avatarUrl: profile.avatarUrl || '',
    role: profile.role || 'Student',
    department: profile.department || 'General Academic',
    rollNumber: profile.rollNumber || '',
    karma: 100,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userRef, newProfile, { merge: true });

  return {
    id: uid,
    username: newProfile.displayName,
    handle: newProfile.handle,
    email: newProfile.email,
    avatarUrl: newProfile.avatarUrl,
    karma: String(newProfile.karma),
    role: newProfile.role,
    department: newProfile.department,
    rollNumber: newProfile.rollNumber,
    isLoggedIn: true,
    createdAt: new Date().toISOString(),
  };
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const data: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.username !== undefined) data.displayName = updates.username;
  if (updates.handle !== undefined) data.handle = updates.handle;
  if (updates.department !== undefined) data.department = updates.department;
  if (updates.rollNumber !== undefined) data.rollNumber = updates.rollNumber;
  if (updates.role !== undefined) data.role = updates.role;
  if (updates.avatarUrl !== undefined) data.avatarUrl = updates.avatarUrl;

  await updateDoc(userRef, data);
}

// ============================================================================
// 2. COMMUNITIES SERVICE
// ============================================================================

export const DEFAULT_COMMUNITIES: Omit<Community, 'id' | 'createdAt'>[] = [
  {
    name: 'Robotics Club',
    slug: 'robotics-club',
    prefix: 'c/',
    title: 'Robotics & Automation Laboratory',
    description: 'Hardware hacking, ROS2 navigation, 3D printing, and mechatronic systems for university challenges.',
    memberCount: 1420,
    category: 'club',
    tier: 'TIER 1 · MAKERSPACE',
    iconBg: '#FF6848',
  },
  {
    name: 'Coding & Algorithms',
    slug: 'coding-algorithms',
    prefix: 'c/',
    title: 'Competitive Programming & Systems',
    description: 'DSA practice, ICPC prep, system architecture, open-source development, and peer mock interviews.',
    memberCount: 2840,
    category: 'academic',
    tier: 'ACTIVE DEPT',
    iconBg: '#3B82F6',
  },
  {
    name: 'Hackathon Commons',
    slug: 'hackathon-teams',
    prefix: 'c/',
    title: 'Hackathon Teammate Matchmaker',
    description: 'Find frontend, AI/ML, and hardware teammates for upcoming national and international student hackathons.',
    memberCount: 1950,
    category: 'commons',
    tier: 'COMMONS',
    iconBg: '#10B981',
  },
  {
    name: 'Examination Cell',
    slug: 'examination-cell',
    prefix: 'c/',
    title: 'Office of the Controller of Examinations',
    description: 'Official timetables, hall ticket schedules, seating matrices, clash resolution, and grade declarations.',
    memberCount: 4280,
    category: 'official',
    tier: 'ADMINISTRATIVE',
    iconBg: '#8B5CF6',
  },
  {
    name: 'Career & Placements',
    slug: 'career-placements',
    prefix: 'c/',
    title: 'Centre for Career Development',
    description: 'Internship drives, campus recruitment bulletins, resume reviews, and industry speaker sessions.',
    memberCount: 3120,
    category: 'official',
    tier: 'OFFICIAL CDC',
    iconBg: '#F59E0B',
  },
  {
    name: 'IEEE Student Branch',
    slug: 'ieee-student-branch',
    prefix: 'c/',
    title: 'IEEE Collegiate Section',
    description: 'Technical conferences, research paper reading groups, hardware workshops, and student member grants.',
    memberCount: 880,
    category: 'club',
    tier: 'AFFILIATED',
    iconBg: '#06B6D4',
  },
];

export async function listCommunities(): Promise<Community[]> {
  const commRef = collection(db, 'communities');
  const snap = await getDocs(query(commRef, orderBy('memberCount', 'desc')));

  if (snap.empty) {
    // Seed default communities into Firestore so the database is populated
    const seededList: Community[] = [];
    for (const item of DEFAULT_COMMUNITIES) {
      const docRef = await addDoc(commRef, {
        ...item,
        createdAt: serverTimestamp(),
      });
      seededList.push({
        id: docRef.id,
        ...item,
        createdAt: new Date().toISOString(),
      });
    }
    return seededList;
  }

  return snap.docs.map((d) => {
    const data = d.data();
    const { iso } = formatTimestamp(data.createdAt);
    return {
      id: d.id,
      name: data.name || data.title || '',
      slug: data.slug || d.id,
      prefix: data.prefix || 'c/',
      title: data.title || data.name || '',
      description: data.description || '',
      memberCount: data.memberCount || 0,
      category: data.category || 'commons',
      tier: data.tier || '',
      iconBg: data.iconBg || '#FF6848',
      createdAt: iso,
    };
  });
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const commRef = collection(db, 'communities');
  const cleanSlug = slug.toLowerCase().replace(/^c\//, '').replace(/_/g, '-');
  const q = query(commRef, where('slug', '==', cleanSlug), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const d = snap.docs[0];
    const data = d.data();
    const { iso } = formatTimestamp(data.createdAt);
    return {
      id: d.id,
      name: data.name || data.title || '',
      slug: data.slug || cleanSlug,
      prefix: data.prefix || 'c/',
      title: data.title || data.name || '',
      description: data.description || '',
      memberCount: data.memberCount || 0,
      category: data.category || 'commons',
      tier: data.tier || '',
      iconBg: data.iconBg || '#FF6848',
      createdAt: iso,
    };
  }

  // Fallback search by name
  const allCommunities = await listCommunities();
  const found = allCommunities.find(
    (c) =>
      c.slug.toLowerCase() === cleanSlug ||
      c.name.toLowerCase() === cleanSlug ||
      c.name.toLowerCase().replace(/\s+/g, '-') === cleanSlug
  );
  return found || null;
}

export async function checkCommunityMembership(communityId: string, uid: string): Promise<boolean> {
  if (!communityId || !uid) return false;
  const memberDoc = await getDoc(doc(db, 'communities', communityId, 'members', uid));
  return memberDoc.exists();
}

export async function joinCommunity(communityId: string, uid: string, userHandle?: string): Promise<void> {
  const memberRef = doc(db, 'communities', communityId, 'members', uid);
  await setDoc(memberRef, {
    uid,
    userHandle: userHandle || '',
    joinedAt: serverTimestamp(),
  });
  // Increment memberCount on the community document
  const commRef = doc(db, 'communities', communityId);
  await updateDoc(commRef, {
    memberCount: increment(1),
  }).catch(() => {
    // Non-fatal if community doc doesn't exist yet
  });
}

export async function leaveCommunity(communityId: string, uid: string): Promise<void> {
  const memberRef = doc(db, 'communities', communityId, 'members', uid);
  await deleteDoc(memberRef);
  const commRef = doc(db, 'communities', communityId);
  await updateDoc(commRef, {
    memberCount: increment(-1),
  }).catch(() => {
    // Non-fatal
  });
}

export async function getUserJoinedCommunities(uid: string): Promise<string[]> {
  if (!uid) return [];
  const communities = await listCommunities();
  const joinedSlugs: string[] = [];
  for (const c of communities) {
    const isMember = await checkCommunityMembership(c.id, uid);
    if (isMember) {
      joinedSlugs.push(c.slug);
    }
  }
  return joinedSlugs;
}

// ============================================================================
// 3. POSTS SERVICE
// ============================================================================

export async function listPosts(params?: {
  community?: string;
  communitySlug?: string;
  sort?: 'hot' | 'new' | 'top';
  limitCount?: number;
  currentUserId?: string;
}): Promise<PostItem[]> {
  const postsRef = collection(db, 'posts');
  let q = query(postsRef, orderBy('createdAt', 'desc'), limit(params?.limitCount || 30));

  if (params?.sort === 'top') {
    q = query(postsRef, orderBy('upvotes', 'desc'), limit(params?.limitCount || 30));
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    return [];
  }

  const posts: PostItem[] = [];
  const filterCommunity = params?.community || params?.communitySlug;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const { display, iso } = formatTimestamp(data.createdAt);

    const postCommunity = data.community || 'Campus Feed';
    const postCommunitySlug = data.communitySlug || postCommunity.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-');

    // Community filter if specified
    if (filterCommunity && filterCommunity !== 'all' && filterCommunity !== 'all-campus') {
      const cleanTarget = filterCommunity.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-');
      const cleanPostComm = postCommunity.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-');
      if (cleanTarget !== cleanPostComm && cleanTarget !== postCommunitySlug) {
        continue;
      }
    }

    posts.push({
      id: docSnap.id,
      community: postCommunity.startsWith('c/') ? postCommunity : `c/${postCommunity}`,
      communityPrefix: 'c/',
      author: data.authorName || data.author || 'Campus Member',
      authorRole: data.authorRole || 'Student',
      authorBadge: data.authorBadge,
      authorBadgeType: data.authorBadgeType || 'student',
      title: data.title || '',
      content: data.content || '',
      timestamp: display,
      createdAt: iso,
      pinned: Boolean(data.pinned),
      pinnedLabel: data.pinnedLabel,
      flairs: data.flairs || [],
      categoryTier: data.categoryTier,
      docCode: data.docCode,
      upvotes: typeof data.upvotes === 'number' ? data.upvotes : 1,
      commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
      attachment: data.attachment || undefined,
      hasUserUpvoted: false,
      hasUserDownvoted: false,
      isSaved: false,
    });
  }

  // Hydrate user vote and save states if authenticated
  if (params?.currentUserId && posts.length > 0) {
    const uid = params.currentUserId;
    await Promise.all(
      posts.map(async (p) => {
        try {
          const voteDoc = await getDoc(doc(db, 'posts', p.id, 'votes', uid));
          if (voteDoc.exists()) {
            const vData = voteDoc.data();
            p.hasUserUpvoted = vData.voteType === 'up';
            p.hasUserDownvoted = vData.voteType === 'down';
          }
          const savedDoc = await getDoc(doc(db, 'users', uid, 'savedPosts', p.id));
          p.isSaved = savedDoc.exists();
        } catch {
          // Ignore hydration failure for individual post
        }
      })
    );
  }

  return posts;
}

export async function createPost(postData: {
  title: string;
  content: string;
  community: string;
  communityPrefix?: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorRole?: string;
  authorBadgeType?: 'mod' | 'official' | 'tech' | 'student' | 'alumni';
  flairs?: { label: string; bg: string; text: string; border?: string }[];
  attachment?: PostAttachment;
  pinned?: boolean;
  pinnedLabel?: string;
  categoryTier?: string;
  docCode?: string;
}): Promise<PostItem> {
  const postsRef = collection(db, 'posts');
  const cleanCommunity = postData.community.startsWith('c/')
    ? postData.community
    : `c/${postData.community}`;
  const communitySlug = cleanCommunity.replace(/^c\//, '').toLowerCase().replace(/\s+/g, '-');

  const newDocData = {
    title: postData.title.trim(),
    content: postData.content.trim(),
    community: cleanCommunity,
    communitySlug,
    authorId: postData.authorId,
    authorName: postData.authorName,
    authorHandle: postData.authorHandle || `u/${postData.authorName.toLowerCase().replace(/\s+/g, '_')}`,
    authorRole: postData.authorRole || 'Student',
    authorBadgeType: postData.authorBadgeType || 'student',
    flairs: postData.flairs || [],
    attachment: postData.attachment || null,
    pinned: Boolean(postData.pinned),
    pinnedLabel: postData.pinnedLabel || null,
    categoryTier: postData.categoryTier || null,
    docCode: postData.docCode || null,
    upvotes: 1,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(postsRef, newDocData);

  // Author automatically upvotes own post
  if (postData.authorId) {
    const voteRef = doc(db, 'posts', docRef.id, 'votes', postData.authorId);
    await setDoc(voteRef, {
      uid: postData.authorId,
      voteType: 'up',
      createdAt: serverTimestamp(),
    }).catch(() => {});
  }

  return {
    id: docRef.id,
    community: cleanCommunity,
    communityPrefix: 'c/',
    author: postData.authorName,
    authorRole: postData.authorRole || 'Student',
    authorBadgeType: postData.authorBadgeType || 'student',
    title: postData.title,
    content: postData.content,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    pinned: postData.pinned,
    pinnedLabel: postData.pinnedLabel,
    flairs: postData.flairs,
    categoryTier: postData.categoryTier,
    docCode: postData.docCode,
    upvotes: 1,
    commentsCount: 0,
    hasUserUpvoted: true,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: postData.attachment,
  };
}

export async function deletePost(postId: string, authorId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) {
    throw new Error('Post not found');
  }
  const data = snap.data();
  if (data.authorId !== authorId) {
    throw new Error('Unauthorized to delete this post');
  }
  await deleteDoc(postRef);
}

// ============================================================================
// 4. VOTES SERVICE
// ============================================================================

export async function votePost(
  postId: string,
  uid: string,
  type: 'up' | 'down'
): Promise<{ newUpvotes: number; userVote: 'up' | 'down' | null }> {
  const voteRef = doc(db, 'posts', postId, 'votes', uid);
  const postRef = doc(db, 'posts', postId);

  const existingVoteSnap = await getDoc(voteRef);
  const existingVote = existingVoteSnap.exists() ? existingVoteSnap.data().voteType : null;

  let delta = 0;
  let finalVote: 'up' | 'down' | null = null;

  if (type === 'up') {
    if (existingVote === 'up') {
      // Remove upvote
      delta = -1;
      await deleteDoc(voteRef);
      finalVote = null;
    } else if (existingVote === 'down') {
      // Switch from down to up (+2)
      delta = 2;
      await setDoc(voteRef, { uid, voteType: 'up', updatedAt: serverTimestamp() });
      finalVote = 'up';
    } else {
      // New upvote (+1)
      delta = 1;
      await setDoc(voteRef, { uid, voteType: 'up', createdAt: serverTimestamp() });
      finalVote = 'up';
    }
  } else {
    // downvote
    if (existingVote === 'down') {
      // Remove downvote (+1)
      delta = 1;
      await deleteDoc(voteRef);
      finalVote = null;
    } else if (existingVote === 'up') {
      // Switch from up to down (-2)
      delta = -2;
      await setDoc(voteRef, { uid, voteType: 'down', updatedAt: serverTimestamp() });
      finalVote = 'down';
    } else {
      // New downvote (-1)
      delta = -1;
      await setDoc(voteRef, { uid, voteType: 'down', createdAt: serverTimestamp() });
      finalVote = 'down';
    }
  }

  // Update total count on the post
  await updateDoc(postRef, {
    upvotes: increment(delta),
    updatedAt: serverTimestamp(),
  });

  const updatedSnap = await getDoc(postRef);
  const newUpvotes = updatedSnap.exists() ? updatedSnap.data().upvotes || 0 : 0;

  return { newUpvotes, userVote: finalVote };
}

// ============================================================================
// 5. SAVED POSTS SERVICE
// ============================================================================

export async function toggleSavePost(uid: string, postId: string): Promise<boolean> {
  const saveRef = doc(db, 'users', uid, 'savedPosts', postId);
  const snap = await getDoc(saveRef);

  if (snap.exists()) {
    await deleteDoc(saveRef);
    return false;
  } else {
    await setDoc(saveRef, {
      postId,
      savedAt: serverTimestamp(),
    });
    return true;
  }
}

export async function listSavedPosts(uid: string): Promise<PostItem[]> {
  const savedRef = collection(db, 'users', uid, 'savedPosts');
  const snap = await getDocs(savedRef);

  if (snap.empty) {
    return [];
  }

  const posts: PostItem[] = [];
  for (const docSnap of snap.docs) {
    const postId = docSnap.id;
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (postSnap.exists()) {
      const data = postSnap.data();
      const { display, iso } = formatTimestamp(data.createdAt);
      posts.push({
        id: postSnap.id,
        community: data.community || 'Campus Feed',
        communityPrefix: 'c/',
        author: data.authorName || 'Student',
        authorRole: data.authorRole || 'Student',
        title: data.title || '',
        content: data.content || '',
        timestamp: display,
        createdAt: iso,
        pinned: Boolean(data.pinned),
        pinnedLabel: data.pinnedLabel,
        flairs: data.flairs || [],
        categoryTier: data.categoryTier,
        docCode: data.docCode,
        upvotes: data.upvotes || 0,
        commentsCount: data.commentsCount || 0,
        attachment: data.attachment || undefined,
        isSaved: true,
      });
    }
  }
  return posts;
}

// ============================================================================
// 6. COMMENTS SERVICE
// ============================================================================

export async function listComments(postId: string): Promise<CommentItem[]> {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const { display, iso } = formatTimestamp(data.createdAt);
    return {
      id: docSnap.id,
      postId,
      author: data.author || data.authorName || 'Campus Member',
      authorRole: data.authorRole || 'Student',
      content: data.content || '',
      timestamp: display,
      createdAt: iso,
      upvotes: data.upvotes || 0,
    };
  });
}

export async function addComment(
  postId: string,
  data: {
    authorId: string;
    author: string;
    authorRole?: string;
    content: string;
  }
): Promise<CommentItem> {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const postRef = doc(db, 'posts', postId);

  const docRef = await addDoc(commentsRef, {
    authorId: data.authorId,
    author: data.author,
    authorRole: data.authorRole || 'Student',
    content: data.content.trim(),
    upvotes: 0,
    createdAt: serverTimestamp(),
  });

  // Increment commentsCount on the post
  await updateDoc(postRef, {
    commentsCount: increment(1),
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return {
    id: docRef.id,
    postId,
    author: data.author,
    authorRole: data.authorRole || 'Student',
    content: data.content.trim(),
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
}

export async function deleteComment(postId: string, commentId: string, authorId: string): Promise<void> {
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error('Comment not found');
  }
  if (snap.data().authorId !== authorId) {
    throw new Error('Unauthorized to delete this comment');
  }
  await deleteDoc(commentRef);

  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    commentsCount: increment(-1),
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

// ============================================================================
// 7. NOTICES SERVICE
// ============================================================================

export const DEFAULT_NOTICES: Omit<CircularNoticeItem, 'id' | 'publishedAt'>[] = [
  {
    docCode: 'DOC-PID-9482-COE',
    title: 'End-Semester Examination Schedule — Comprehensive Timetable (Autumn 2024)',
    source: 'Examination Cell',
    officerName: 'Dr. V. Ramanathan (Controller of Examinations)',
    category: 'TIER 1 · INSTITUTIONAL',
    documentDate: 'Nov 28, 2024',
    summaryBullets: [
      'Slot Examination Timetable: Standardized slot schedule for all B.Tech/M.Tech programs commences Dec 12.',
      'Conflict Resolution Window: If two registered courses conflict in the timetable, submit portal ticket before Dec 03, 23:59.',
      'Mandatory Hall Tickets: Download signed admit cards via academic portal. Physical verification required at hall entry.',
    ],
    extractedText: 'Full examination schedule approved by Academic Council.',
    fileName: 'circular_endsem_schedule_latest.pdf',
    fileSize: '2.4 MB',
    status: 'broadcasted',
    targetAudience: '4,280 Enrolled Students & Faculty Invigilators',
    channels: ['Examination Cell', 'Campus Feed', 'Student Push'],
  },
  {
    docCode: 'DOC-ADM-4102-REG',
    title: 'Hostel Curfew Extension & Library 24-Hour Operation Directives',
    source: 'Dean of Student Affairs',
    officerName: 'Prof. Anjali Mathur (Dean of Student Affairs)',
    category: 'TIER 2 · CAMPUS LIFE',
    documentDate: 'Nov 24, 2024',
    summaryBullets: [
      'Central Library 24/7 Hours: Reading rooms 1st through 3rd floor will operate continuously with power backup during exam weeks.',
      'Night Canteen Operations: SAC cafeteria and hostel canteens extended until 03:00 AM.',
      'Campus Shuttle Service: Transit buses will operate every 20 minutes connecting academic blocks to student residential quads.',
    ],
    extractedText: 'Administrative order for student welfare during semester finals.',
    fileName: 'library_extended_hours_circular.pdf',
    fileSize: '1.2 MB',
    status: 'broadcasted',
    targetAudience: 'All Resident Students',
    channels: ['Campus Feed', 'Hostel Council'],
  },
  {
    docCode: 'DOC-CDC-8819-INT',
    title: 'Summer 2025 Internship Placement Drive & Resume Freeze',
    source: 'Centre for Career Development',
    officerName: 'Dr. S. K. Nair (Head of Placement & Training)',
    category: 'TIER 1 · CAREER & PLACEMENT',
    documentDate: 'Nov 20, 2024',
    summaryBullets: [
      'Master Resume Freeze: Final master resume submissions close on Dec 05 at 17:00 IST.',
      'Pre-Placement Talks: Microsoft, Google, and Qualcomm sessions begin next week in the Main Auditorium.',
      'Tier 1 Internship Eligibility: Minimum 7.5 CGPA required with zero active backlogs.',
    ],
    extractedText: 'Placement guidelines and eligibility criteria for summer internship season.',
    fileName: 'cdc_internship_handbook_2025.pdf',
    fileSize: '3.1 MB',
    status: 'broadcasted',
    targetAudience: 'Pre-final Year Students (Class of 2026)',
    channels: ['Career & Placements', 'Campus Feed'],
  },
];

export async function listNotices(limitCount: number = 20): Promise<CircularNoticeItem[]> {
  const noticesRef = collection(db, 'notices');
  const q = query(noticesRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);

  if (snap.empty) {
    // Seed initial default notices into Firestore
    const seededNotices: CircularNoticeItem[] = [];
    for (const item of DEFAULT_NOTICES) {
      const docRef = await addDoc(noticesRef, {
        ...item,
        createdAt: serverTimestamp(),
      });
      seededNotices.push({
        id: docRef.id,
        ...item,
        publishedAt: new Date().toISOString(),
      });
    }
    return seededNotices;
  }

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const { display } = formatTimestamp(data.createdAt);
    return {
      id: docSnap.id,
      docCode: data.docCode || 'DOC-ORD-GEN',
      title: data.title || 'Official Campus Notice',
      source: data.source || 'Campus Administration',
      officerName: data.officerName || 'Administrative Officer',
      category: data.category || 'TIER 1 · INSTITUTIONAL',
      documentDate: data.documentDate || 'Recent',
      summaryBullets: Array.isArray(data.summaryBullets)
        ? data.summaryBullets
        : [data.summary || 'Official academic circular directive.'],
      extractedText: data.extractedText,
      fileName: data.fileName || 'circular.pdf',
      fileSize: data.fileSize || '1.5 MB',
      publishedAt: display,
      status: data.status || 'broadcasted',
      targetAudience: data.targetAudience || 'Campus Community',
      channels: Array.isArray(data.channels) ? data.channels : ['Campus Feed'],
    };
  });
}

export async function publishNotice(noticeData: {
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
  fileUrl?: string;
  targetAudience?: string;
  channels?: string[];
  authorId: string;
  authorRole?: string;
}): Promise<string> {
  const noticesRef = collection(db, 'notices');
  const newNotice = {
    docCode: noticeData.docCode.trim(),
    title: noticeData.title.trim(),
    source: noticeData.source.trim(),
    officerName: noticeData.officerName.trim(),
    category: noticeData.category.trim(),
    documentDate: noticeData.documentDate.trim(),
    summaryBullets: noticeData.summaryBullets,
    extractedText: noticeData.extractedText || '',
    fileName: noticeData.fileName || 'official_circular.pdf',
    fileSize: noticeData.fileSize || '1.5 MB',
    fileUrl: noticeData.fileUrl || null,
    targetAudience: noticeData.targetAudience || 'All Students & Faculty',
    channels: noticeData.channels || ['Campus Feed', 'Notices Hub'],
    authorId: noticeData.authorId,
    authorRole: noticeData.authorRole || 'Admin',
    status: 'broadcasted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(noticesRef, newNotice);

  // Also publish notice to the campus feed as a pinned official post
  const postsRef = collection(db, 'posts');
  await addDoc(postsRef, {
    title: noticeData.title.trim(),
    content: noticeData.summaryBullets.join('\n\n• '),
    community: noticeData.source.startsWith('c/') ? noticeData.source : `c/${noticeData.source.toLowerCase().replace(/\s+/g, '_')}`,
    communitySlug: noticeData.source.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-'),
    authorId: noticeData.authorId,
    authorName: noticeData.officerName,
    authorHandle: `u/${noticeData.source.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '_')}`,
    authorRole: noticeData.authorRole || 'Official Staff',
    authorBadgeType: 'official',
    pinned: true,
    pinnedLabel: 'OFFICIAL NOTICE',
    categoryTier: noticeData.category,
    docCode: noticeData.docCode,
    upvotes: 1,
    commentsCount: 0,
    attachment: {
      type: 'pdf',
      fileName: noticeData.fileName || 'official_circular.pdf',
      fileSize: noticeData.fileSize || '1.5 MB',
      metaText: `Executive Summary Broadcasted · Ref: ${noticeData.docCode}`,
      verifiedLabel: 'Dean Authenticated (Tier 1)',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return docRef.id;
}

// ============================================================================
// 8. STORAGE SERVICE: REAL FILE UPLOADS
// ============================================================================

export async function uploadPostAttachment(
  file: File,
  pathPrefix: string = 'attachments'
): Promise<{ fileUrl: string; fileName: string; fileSize: string; fileType: string }> {
  // Validate file size (max 25MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File size exceeds maximum limit of 25MB.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${pathPrefix}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = await uploadBytesResumable(storageRef, file);
  const downloadUrl = await getDownloadURL(uploadTask.ref);

  const formattedSize =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  const isPdf = file.type.includes('pdf') || cleanName.endsWith('.pdf');
  const isImage = file.type.startsWith('image/');
  const fileType = isPdf ? 'pdf' : isImage ? 'image' : 'file';

  return {
    fileUrl: downloadUrl,
    fileName: cleanName,
    fileSize: formattedSize,
    fileType,
  };
}
