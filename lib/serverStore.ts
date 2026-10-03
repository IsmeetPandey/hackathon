import { PostItem, CommentItem, CircularNoticeItem } from '@/types';
import { ALL_CAMPUS_POSTS, ROBOTICS_POSTS, DEMO_COMMENTS, DEMO_NOTICES } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Persistent in-memory global state across server route invocations in Next.js
declare global {
  var __collegeConnectStore: {
    posts: PostItem[];
    votes: Map<string, 'up' | 'down'>; // key: `${postId}:${userHandle}`
    savedPosts: Set<string>; // key: `${postId}:${userHandle}`
    memberships: Set<string>; // key: `${communitySlug}:${userHandle}`
    comments: Map<string, CommentItem[]>; // key: postId
    notices: CircularNoticeItem[];
  } | undefined;
}

function getStore() {
  if (!globalThis.__collegeConnectStore) {
    const initialPosts: PostItem[] = [
      ...ALL_CAMPUS_POSTS,
      ...ROBOTICS_POSTS.filter((p) => !ALL_CAMPUS_POSTS.some((ap) => ap.id === p.id)),
    ];

    const initialComments = new Map<string, CommentItem[]>();
    Object.entries(DEMO_COMMENTS).forEach(([postId, comms]) => {
      initialComments.set(postId, [...comms]);
    });

    const initialMemberships = new Set<string>();
    initialMemberships.add('hackathon_teams:ananya_s');
    initialMemberships.add('robotics-club:ananya_s');

    globalThis.__collegeConnectStore = {
      posts: initialPosts,
      votes: new Map(),
      savedPosts: new Set(),
      memberships: initialMemberships,
      comments: initialComments,
      notices: [...DEMO_NOTICES],
    };
  }
  return globalThis.__collegeConnectStore;
}

export async function fetchServerPosts(params?: {
  community?: string;
  search?: string;
  sort?: 'hot' | 'new' | 'top';
  userHandle?: string;
}): Promise<PostItem[]> {
  const store = getStore();

  // If Supabase is configured, attempt fetch from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (params?.community && params.community !== 'all' && params.community !== 'all-campus') {
        query = query.eq('community_slug', params.community);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          community: d.community_slug,
          communityPrefix: '',
          author: d.author_handle,
          authorRole: d.author_role,
          title: d.title,
          content: d.content,
          timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: d.created_at,
          upvotes: d.upvotes,
          commentsCount: d.comments_count,
          pinned: d.pinned,
          pinnedLabel: d.pinned_label,
          categoryTier: d.category_tier,
          flairs: d.flairs,
          attachment: d.attachment,
        }));
      }
    } catch (e) {
      console.warn('Supabase posts fetch failed, serving from local store:', e);
    }
  }

  let results = [...store.posts];

  // Filter by community
  if (params?.community && params.community !== 'all' && params.community !== 'all-campus') {
    const target = params.community.toLowerCase();
    results = results.filter((p) => p.community.toLowerCase() === target || p.community.toLowerCase().replace(/^c\//, '') === target.replace(/^c\//, ''));
  }

  // Filter by search
  if (params?.search) {
    const q = params.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q)
    );
  }

  // Sort
  if (params?.sort === 'new') {
    results.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  } else if (params?.sort === 'top') {
    results.sort((a, b) => b.upvotes - a.upvotes);
  }

  // Hydrate user-specific vote & save status
  const handle = params?.userHandle || 'u/ananya_s';
  return results.map((p) => {
    const voteKey = `${p.id}:${handle}`;
    const vote = store.votes.get(voteKey);
    const isSaved = store.savedPosts.has(voteKey);
    return {
      ...p,
      hasUserUpvoted: vote === 'up',
      hasUserDownvoted: vote === 'down',
      isSaved,
    };
  });
}

export async function insertServerPost(newPostData: {
  community: string;
  title: string;
  content: string;
  author: string;
  authorRole?: string;
  flairs?: { label: string; bg: string; text: string; border?: string }[];
  attachment?: any;
}): Promise<PostItem> {
  const store = getStore();

  const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const post: PostItem = {
    id,
    community: newPostData.community.startsWith('c/') ? newPostData.community : `c/${newPostData.community}`,
    communityPrefix: 'c/',
    author: newPostData.author,
    authorRole: newPostData.authorRole || 'Student',
    authorBadgeType: 'student',
    timestamp: 'Just now',
    createdAt: now,
    title: newPostData.title.trim(),
    content: newPostData.content.trim(),
    upvotes: 1,
    commentsCount: 0,
    hasUserUpvoted: true,
    flairs: newPostData.flairs,
    attachment: newPostData.attachment,
  };

  // Prepend to server memory
  store.posts.unshift(post);
  store.votes.set(`${id}:${newPostData.author}`, 'up');

  // If Supabase is configured, write to Supabase asynchronously
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('posts').insert({
        id,
        community_slug: post.community,
        author_handle: post.author,
        author_role: post.authorRole,
        title: post.title,
        content: post.content,
        upvotes: 1,
        comments_count: 0,
        flairs: post.flairs || [],
        attachment: post.attachment || null,
        created_at: now,
      });
    } catch (e) {
      console.warn('Supabase post insertion error:', e);
    }
  }

  return post;
}

export async function recordPostVote(
  postId: string,
  userHandle: string,
  voteType: 'up' | 'down'
): Promise<{ success: boolean; newUpvotes: number; userVote: 'up' | 'down' | null }> {
  const store = getStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, newUpvotes: 0, userVote: null };
  }

  const voteKey = `${postId}:${userHandle}`;
  const existingVote = store.votes.get(voteKey);

  let newUpvotes = post.upvotes;
  let finalVote: 'up' | 'down' | null = null;

  if (voteType === 'up') {
    if (existingVote === 'up') {
      newUpvotes -= 1;
      store.votes.delete(voteKey);
      finalVote = null;
    } else if (existingVote === 'down') {
      newUpvotes += 2;
      store.votes.set(voteKey, 'up');
      finalVote = 'up';
    } else {
      newUpvotes += 1;
      store.votes.set(voteKey, 'up');
      finalVote = 'up';
    }
  } else {
    if (existingVote === 'down') {
      newUpvotes += 1;
      store.votes.delete(voteKey);
      finalVote = null;
    } else if (existingVote === 'up') {
      newUpvotes -= 2;
      store.votes.set(voteKey, 'down');
      finalVote = 'down';
    } else {
      newUpvotes -= 1;
      store.votes.set(voteKey, 'down');
      finalVote = 'down';
    }
  }

  post.upvotes = newUpvotes;

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('posts').update({ upvotes: newUpvotes }).eq('id', postId);
      if (finalVote) {
        await supabase.from('post_votes').upsert({
          post_id: postId,
          user_handle: userHandle,
          vote_type: finalVote,
        });
      } else {
        await supabase.from('post_votes').delete().match({ post_id: postId, user_handle: userHandle });
      }
    } catch (e) {
      console.warn('Supabase vote sync error:', e);
    }
  }

  return { success: true, newUpvotes, userVote: finalVote };
}

export async function toggleSavePost(
  postId: string,
  userHandle: string
): Promise<{ success: boolean; isSaved: boolean }> {
  const store = getStore();
  const key = `${postId}:${userHandle}`;
  const isSaved = store.savedPosts.has(key);

  if (isSaved) {
    store.savedPosts.delete(key);
  } else {
    store.savedPosts.add(key);
  }

  const newState = !isSaved;

  if (isSupabaseConfigured && supabase) {
    try {
      if (newState) {
        await supabase.from('saved_posts').insert({ post_id: postId, user_handle: userHandle });
      } else {
        await supabase.from('saved_posts').delete().match({ post_id: postId, user_handle: userHandle });
      }
    } catch (e) {
      console.warn('Supabase save sync error:', e);
    }
  }

  return { success: true, isSaved: newState };
}

export async function toggleCommunityMembership(
  communitySlug: string,
  userHandle: string
): Promise<{ success: boolean; isJoined: boolean }> {
  const store = getStore();
  const key = `${communitySlug}:${userHandle}`;
  const isJoined = store.memberships.has(key);

  if (isJoined) {
    store.memberships.delete(key);
  } else {
    store.memberships.add(key);
  }

  const newState = !isJoined;
  return { success: true, isJoined: newState };
}

export async function getPostComments(postId: string): Promise<CommentItem[]> {
  const store = getStore();
  return store.comments.get(postId) || [];
}

export async function addPostComment(
  postId: string,
  author: string,
  content: string,
  authorRole?: string
): Promise<CommentItem> {
  const store = getStore();
  const commentsList = store.comments.get(postId) || [];

  const comment: CommentItem = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    postId,
    author,
    authorRole: authorRole || 'Student',
    content: content.trim(),
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };

  commentsList.push(comment);
  store.comments.set(postId, commentsList);

  // Increment comments count on post
  const post = store.posts.find((p) => p.id === postId);
  if (post) {
    post.commentsCount += 1;
  }

  return comment;
}

export async function getServerNotices(): Promise<CircularNoticeItem[]> {
  const store = getStore();
  return store.notices;
}

export async function insertServerNotice(noticeData: Partial<CircularNoticeItem>): Promise<CircularNoticeItem> {
  const store = getStore();
  const id = `notice-${Date.now()}`;
  const now = new Date().toISOString();

  const notice: CircularNoticeItem = {
    id,
    docCode: noticeData.docCode || `DOC-COE-${Math.floor(1000 + Math.random() * 9000)}`,
    title: noticeData.title || 'Official Academic Circular',
    source: noticeData.source || 'c/examination_cell',
    officerName: noticeData.officerName || 'Controller of Examinations',
    category: noticeData.category || 'TIER 1 · INSTITUTIONAL',
    documentDate: noticeData.documentDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    summaryBullets: noticeData.summaryBullets && noticeData.summaryBullets.length > 0 ? noticeData.summaryBullets : [
      'Official directive issued by Academic Administration.',
      'Mandatory review for all registered campus students.',
    ],
    extractedText: noticeData.extractedText || '',
    fileName: noticeData.fileName || 'official_circular.pdf',
    fileSize: noticeData.fileSize || '1.8 MB',
    publishedAt: now,
    status: 'broadcasted',
    targetAudience: noticeData.targetAudience || '4,280 Enrolled Students',
    channels: noticeData.channels || ['c/examination_cell', 'c/all-campus'],
  };

  store.notices.unshift(notice);

  // Also publish as a pinned post in the main feed so students see it immediately!
  const circularPost: PostItem = {
    id: `post-notice-${Date.now()}`,
    community: notice.source,
    communityPrefix: 'c/',
    author: 'u/COE_Official',
    authorRole: 'COE Staff',
    authorBadgeType: 'official',
    pinned: true,
    pinnedLabel: 'PINNED BY DEANERY',
    categoryTier: notice.category,
    docCode: notice.docCode,
    title: notice.title,
    content: notice.summaryBullets.join('\n\n• '),
    timestamp: 'Just now',
    createdAt: now,
    upvotes: 1,
    commentsCount: 0,
    attachment: {
      type: 'pdf',
      fileName: notice.fileName,
      fileSize: notice.fileSize,
      metaText: `Executive Summary Broadcasted · Ref: ${notice.docCode}`,
      verifiedLabel: 'Dean Authenticated (Tier 1)',
    },
  };
  store.posts.unshift(circularPost);

  return notice;
}
