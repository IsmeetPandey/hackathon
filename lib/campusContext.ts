import { fetchServerPosts, getServerNotices } from '@/lib/serverStore';
import { DEMO_COMMUNITIES } from '@/lib/mockData';

export interface GroundedCampusRecord {
  category: 'notice' | 'post' | 'dining' | 'transport' | 'facility' | 'community' | 'general';
  title: string;
  source: string;
  details: string;
  isDemoSample: boolean;
}

// Verified institutional facilities and logistics (grounded campus directory)
const CAMPUS_SERVICES_DIRECTORY: GroundedCampusRecord[] = [
  {
    category: 'facility',
    title: 'Central Library Hours & Study Spaces',
    source: 'Library Administration',
    details: 'Ground through 3rd floor. Standard hours: 08:00 to 23:00 daily. Extended 24-hour reading rooms open during mid-term and end-semester examination preparation cycles.',
    isDemoSample: true,
  },
  {
    category: 'facility',
    title: 'Robotics & Automation Laboratory (Lab 402)',
    source: 'Department of Mechanical & Mechatronics',
    details: 'Academic Block 4, Room 402. Faculty Advisor: Dr. V. Ramanathan. Equipped with Bambu Lab X1-C, Prusa MK4 3D printers, and 3-axis CNC mill. Requires calendar booking and safety induction.',
    isDemoSample: true,
  },
  {
    category: 'facility',
    title: 'Campus IT & Student Helpdesk',
    source: 'Administrative Block B',
    details: 'Room 102, Academic Block B. Support for campus Wi-Fi, portal credentials, and academic certificates.',
    isDemoSample: true,
  },
  {
    category: 'dining',
    title: 'Hostel Mess & Dining Schedule',
    source: 'Campus Mess Committee',
    details: 'Breakfast: 07:30–09:30, Lunch: 12:00–14:30, Evening Snacks: 17:00–18:00, Dinner: 19:30–21:30. North Mess and South Mess operate daily.',
    isDemoSample: true,
  },
  {
    category: 'dining',
    title: 'Night Canteens & Refreshments',
    source: 'SAC Council',
    details: 'SAC Nescafe outlet and Central Night Canteen operate until 03:00 AM during examination periods with hot beverages and snacks.',
    isDemoSample: true,
  },
  {
    category: 'transport',
    title: 'Campus Shuttle Bus Route & Timings',
    source: 'Estate & Transport Office',
    details: 'Operates 07:00 to 22:30 at 15–20 minute intervals. Route connects Main North Gate, Academic Blocks I–IV, Central Library, SAC Complex, and Hostel Quads.',
    isDemoSample: true,
  },
  {
    category: 'general',
    title: 'Hostel Gate & Turnstile Guidelines',
    source: 'Chief Warden Office',
    details: 'Standard student entry until 23:00. Extended to 01:00 AM during scheduled examination weeks with student ID biometric check-in.',
    isDemoSample: true,
  },
];

/**
 * Retrieves relevant campus context records dynamically based on the user's prompt.
 */
export async function retrieveCampusContext(query: string = ''): Promise<{
  records: GroundedCampusRecord[];
  summaryText: string;
}> {
  const q = query.toLowerCase().trim();
  const matchedRecords: GroundedCampusRecord[] = [];

  // 1. Ingested Administrative Notices from the application database
  try {
    const notices = await getServerNotices();
    for (const notice of notices) {
      const textMatch =
        !q ||
        notice.title.toLowerCase().includes(q) ||
        notice.summaryBullets.some((b) => b.toLowerCase().includes(q)) ||
        notice.docCode.toLowerCase().includes(q) ||
        notice.source.toLowerCase().includes(q) ||
        q.includes('exam') ||
        q.includes('circular') ||
        q.includes('notice') ||
        q.includes('schedule') ||
        q.includes('coe');

      if (textMatch) {
        matchedRecords.push({
          category: 'notice',
          title: `[Official Circular] ${notice.title} (${notice.docCode})`,
          source: `${notice.source} - ${notice.officerName}`,
          details: notice.summaryBullets.join(' | '),
          isDemoSample: false, // live application notice record
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching notices for campus context:', err);
  }

  // 2. Live Posts from the Community Feed
  try {
    const posts = await fetchServerPosts();
    for (const post of posts.slice(0, 10)) {
      const match =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.community.toLowerCase().includes(q);

      if (match) {
        matchedRecords.push({
          category: 'post',
          title: `[Community Post] ${post.title}`,
          source: `${post.community} by ${post.author}`,
          details: post.content.length > 220 ? `${post.content.slice(0, 220)}...` : post.content,
          isDemoSample: true,
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching posts for campus context:', err);
  }

  // 3. Static Campus Services Directory
  for (const item of CAMPUS_SERVICES_DIRECTORY) {
    const match =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (q.includes('food') || q.includes('mess') || q.includes('eat')) && item.category === 'dining' ||
      (q.includes('bus') || q.includes('shuttle') || q.includes('travel')) && item.category === 'transport' ||
      (q.includes('library') || q.includes('lab') || q.includes('room') || q.includes('3d')) && item.category === 'facility' ||
      (q.includes('hostel') || q.includes('curfew') || q.includes('gate')) && item.category === 'general';

    if (match) {
      matchedRecords.push(item);
    }
  }

  // 4. Communities
  if (q.includes('club') || q.includes('community') || q.includes('group') || !q) {
    for (const comm of DEMO_COMMUNITIES.slice(0, 4)) {
      matchedRecords.push({
        category: 'community',
        title: `[Campus Community] ${comm.title} (${comm.slug})`,
        source: comm.category,
        details: `${comm.description} • ${comm.memberCount} active members`,
        isDemoSample: true,
      });
    }
  }

  // Deduplicate and limit to top 6 most relevant items
  const unique = matchedRecords.slice(0, 6);

  // Build compact formatted string
  const summaryText = unique
    .map((r, i) => `${i + 1}. [${r.category.toUpperCase()}] ${r.title}\n   Source: ${r.source}\n   Facts: ${r.details}\n   Data Type: ${r.isDemoSample ? 'Sandbox Demo Record' : 'Live Application Record'}`)
    .join('\n\n');

  return { records: unique, summaryText };
}
