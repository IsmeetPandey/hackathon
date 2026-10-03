import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PostItem, CircularNoticeItem, CommentItem } from '@/types';
import { ALL_CAMPUS_POSTS, DEMO_NOTICES } from '@/lib/mockData';

// --- POSTS SERVICE ---
export async function getCampusPosts(community?: string): Promise<PostItem[]> {
  try {
    const postsRef = collection(db, 'posts');
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(25));
    if (community && community !== 'all-campus') {
      q = query(postsRef, where('community', '==', community), orderBy('createdAt', 'desc'), limit(25));
    }
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed initial posts to Firestore if completely empty so users have immediate rich content
      return ALL_CAMPUS_POSTS;
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        community: data.community || 'Campus Feed',
        communityPrefix: data.communityPrefix || 'c/',
        author: data.authorName || 'Student',
        authorRole: data.authorRole || 'Student',
        title: data.title || '',
        content: data.content || '',
        timestamp: data.createdAt ? 'Recently' : 'Just now',
        upvotes: data.upvotes || 0,
        commentsCount: data.commentsCount || 0,
        isSaved: false,
        hasUserUpvoted: false,
        hasUserDownvoted: false,
        attachment: data.attachment || undefined,
      } as PostItem;
    });
  } catch (err) {
    console.warn('Firestore getCampusPosts fallback to mock data:', err);
    return ALL_CAMPUS_POSTS;
  }
}

export async function createCampusPost(
  title: string,
  content: string,
  community: string,
  authorId: string,
  authorName: string,
  attachment?: any
): Promise<string> {
  const postsRef = collection(db, 'posts');
  const docRef = await addDoc(postsRef, {
    title,
    content,
    community,
    authorId,
    authorName,
    upvotes: 1,
    commentsCount: 0,
    attachment: attachment || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function upvoteCampusPost(postId: string, delta: number = 1): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      upvotes: increment(delta),
    });
  } catch (err) {
    console.warn('Firestore upvote error:', err);
  }
}

// --- NOTICES SERVICE ---
export async function getOfficialNotices(): Promise<CircularNoticeItem[]> {
  try {
    const noticesRef = collection(db, 'notices');
    const q = query(noticesRef, orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return DEMO_NOTICES;
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        summaryBullets: data.summaryBullets || [data.summary || 'Official academic circular notice.'],
        source: data.source || 'c/examination_cell',
        officerName: data.officerName || 'Dr. V. Ramanathan (Controller of Examinations)',
        docCode: data.docCode || 'ORD-2024-OFFICIAL',
        documentDate: data.documentDate || 'Recent',
        category: data.category || 'TIER 1 · INSTITUTIONAL',
        targetAudience: data.targetAudience || 'All Students & Faculty',
        channels: data.channels || ['Campus Feed', 'Notices Hub'],
        publishedAt: data.createdAt ? 'Recently' : 'Just now',
        status: 'broadcasted',
      } as CircularNoticeItem;
    });
  } catch (err) {
    console.warn('Firestore getOfficialNotices fallback:', err);
    return DEMO_NOTICES;
  }
}

export async function publishNotice(
  title: string,
  summary: string,
  source: string,
  docCode: string,
  documentDate: string,
  category: string = 'TIER 1 · INSTITUTIONAL',
  authorId?: string
): Promise<string> {
  const noticesRef = collection(db, 'notices');
  const docRef = await addDoc(noticesRef, {
    title,
    summary,
    summaryBullets: [summary],
    source,
    docCode,
    documentDate,
    category,
    authorId: authorId || 'admin',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
