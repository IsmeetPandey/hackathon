import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface GroundedCampusRecord {
  category: 'notice' | 'post' | 'community';
  title: string;
  source: string;
  details: string;
  docCode?: string;
  date?: string;
}

/**
 * Retrieves relevant verified campus records from Cloud Firestore based on the user's query.
 */
export async function retrieveCampusContext(searchQuery: string = ''): Promise<{
  records: GroundedCampusRecord[];
  summaryText: string;
}> {
  const q = searchQuery.toLowerCase().trim();
  const matchedRecords: GroundedCampusRecord[] = [];

  try {
    // 1. Ingested Official Administrative Notices from Firestore
    const noticesRef = collection(db, 'notices');
    const noticesSnap = await getDocs(query(noticesRef, orderBy('createdAt', 'desc'), limit(15)));

    for (const d of noticesSnap.docs) {
      const notice = d.data();
      const title = notice.title || '';
      const summary = Array.isArray(notice.summaryBullets)
        ? notice.summaryBullets.join(' | ')
        : notice.summary || '';
      const docCode = notice.docCode || '';
      const source = notice.source || '';
      const officer = notice.officerName || '';

      const match =
        !q ||
        title.toLowerCase().includes(q) ||
        summary.toLowerCase().includes(q) ||
        docCode.toLowerCase().includes(q) ||
        source.toLowerCase().includes(q) ||
        q.includes('exam') ||
        q.includes('circular') ||
        q.includes('notice') ||
        q.includes('schedule') ||
        q.includes('briefing') ||
        q.includes('catch me up') ||
        q.includes('today');

      if (match) {
        matchedRecords.push({
          category: 'notice',
          title: `[Official Notice] ${title} (${docCode})`,
          source: `${source} - Signed by ${officer}`,
          details: summary,
          docCode,
          date: notice.documentDate || 'Recent',
        });
      }
    }
  } catch (err) {
    console.warn('Firestore notices fetch for AI context failed:', err);
  }

  try {
    // 2. Active Communities from Firestore
    const commRef = collection(db, 'communities');
    const commSnap = await getDocs(query(commRef, limit(10)));

    for (const d of commSnap.docs) {
      const comm = d.data();
      const name = comm.name || comm.title || '';
      const desc = comm.description || '';
      const slug = comm.slug || '';

      const match =
        !q ||
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q) ||
        q.includes('club') ||
        q.includes('space') ||
        q.includes('community') ||
        q.includes('briefing') ||
        q.includes('catch me up');

      if (match) {
        matchedRecords.push({
          category: 'community',
          title: `[Campus Community] ${name} (c/${slug})`,
          source: `${comm.category || 'Space'} · ${comm.memberCount || 0} members`,
          details: desc,
        });
      }
    }
  } catch (err) {
    console.warn('Firestore communities fetch for AI context failed:', err);
  }

  try {
    // 3. Live Campus Posts from Firestore
    const postsRef = collection(db, 'posts');
    const postsSnap = await getDocs(query(postsRef, orderBy('createdAt', 'desc'), limit(15)));

    for (const d of postsSnap.docs) {
      const post = d.data();
      const title = post.title || '';
      const content = post.content || '';
      const comm = post.community || '';

      const match =
        !q ||
        title.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q) ||
        comm.toLowerCase().includes(q);

      if (match) {
        matchedRecords.push({
          category: 'post',
          title: `[Community Discussion] ${title}`,
          source: `${comm} by ${post.authorName || 'Student'}`,
          details: content.length > 250 ? `${content.slice(0, 250)}...` : content,
        });
      }
    }
  } catch (err) {
    console.warn('Firestore posts fetch for AI context failed:', err);
  }

  // Deduplicate and select top 6 relevant records
  const unique = matchedRecords.slice(0, 6);

  const summaryText =
    unique.length > 0
      ? unique
          .map(
            (r, i) =>
              `${i + 1}. [${r.category.toUpperCase()}] ${r.title}\n   Source: ${r.source}\n   Details: ${r.details}`
          )
          .join('\n\n')
      : '';

  return { records: unique, summaryText };
}
