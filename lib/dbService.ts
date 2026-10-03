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
    name: 'AI & Machine Learning Society',
    slug: 'ai-ml-society',
    prefix: 'c/',
    title: 'Machine Intelligence & Vision Lab',
    description: 'Transformer architectures, computer vision research, Kaggle study groups, and campus GPU cluster workflows.',
    memberCount: 3420,
    category: 'academic',
    tier: 'TIER 1 · AI RESEARCH',
    iconBg: '#6366F1',
  },
  {
    name: 'Aerospace & Rocketry Club',
    slug: 'aerospace-rocketry',
    prefix: 'c/',
    title: 'High-Altitude Sounding & Propulsion',
    description: 'Solid motor telemetry, composite airframes, avionics redundancy, and national space engineering challenges.',
    memberCount: 1150,
    category: 'club',
    tier: 'TIER 1 · AEROSPACE LAB',
    iconBg: '#0284C7',
  },
  {
    name: 'Formula Student Racing',
    slug: 'formula-student-racing',
    prefix: 'c/',
    title: 'Electric Vehicle Motorsport Garage',
    description: '400V powertrain design, chassis telemetry, aerodynamic CFD simulations, and Formula Bharat circuit racing.',
    memberCount: 1280,
    category: 'club',
    tier: 'TIER 1 · RACING GARAGE',
    iconBg: '#EF4444',
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
    name: 'Cybersecurity & Ethical Hacking',
    slug: 'cybersecurity-ctf',
    prefix: 'c/',
    title: 'Capture The Flag (CTF) Security Lab',
    description: 'Reverse engineering, binary exploitation, web app pentesting, cryptography, and inter-university cyber drills.',
    memberCount: 2210,
    category: 'academic',
    tier: 'INFOSEC LAB',
    iconBg: '#14B8A6',
  },
  {
    name: 'Design & Creative Arts Guild',
    slug: 'design-arts-guild',
    prefix: 'c/',
    title: 'UI/UX, 3D & Digital Media Collective',
    description: 'Figma crits, 3D blender modeling, generative design tokens, festival identity branding, and creative exhibitions.',
    memberCount: 1680,
    category: 'club',
    tier: 'CREATIVE LAB',
    iconBg: '#EC4899',
  },
  {
    name: 'E-Cell & Venture Studio',
    slug: 'entrepreneurship-cell',
    prefix: 'c/',
    title: 'Student Startup Incubator & Micro-Grants',
    description: 'Founder mentorship, MVP validation, pitch deck teardowns, angel investor roundtables, and prototyping seed funds.',
    memberCount: 2650,
    category: 'commons',
    tier: 'VENTURE HUB',
    iconBg: '#D97706',
  },
  {
    name: 'Music & Audio Production Society',
    slug: 'music-sound-society',
    prefix: 'c/',
    title: 'Sound Engineering & Acoustic Guild',
    description: 'Live studio recording, modular synth jams, DAW mixing masterclasses, and open-air sunset amphitheatre gigs.',
    memberCount: 1890,
    category: 'club',
    tier: 'PERFORMING ARTS',
    iconBg: '#F43F5E',
  },
  {
    name: 'Astronomy & Space Physics',
    slug: 'astronomy-club',
    prefix: 'c/',
    title: 'Deep Sky Observatory & Astrophotography',
    description: 'Telescope rooftop star parties, exoplanet spectral transit analysis, and celestial radio astronomy projects.',
    memberCount: 920,
    category: 'club',
    tier: 'INTERDISCIPLINARY',
    iconBg: '#818CF8',
  },
  {
    name: 'Debate & Model UN Society',
    slug: 'mun-debate-society',
    prefix: 'c/',
    title: 'Parliamentary Forensics & Diplomacy',
    description: 'Oxford-style debates, international treaty drafting, diplomatic crisis simulations, and public oratory workshops.',
    memberCount: 1340,
    category: 'club',
    tier: 'LITERARY & FORENSICS',
    iconBg: '#84CC16',
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
  {
    name: 'Biotechnology & Bio-Design',
    slug: 'biotech-society',
    prefix: 'c/',
    title: 'Synthetic Biology & Molecular Informatics',
    description: 'Computational genomics, CRISPR bioinformatics pipelines, biomaterials research, and wet-lab safety training.',
    memberCount: 1040,
    category: 'academic',
    tier: 'BIO-RESEARCH',
    iconBg: '#10B981',
  },
];

export async function listCommunities(): Promise<Community[]> {
  const commRef = collection(db, 'communities');
  try {
    const snap = await getDocs(query(commRef, orderBy('memberCount', 'desc')));
    const dbCommunities: Community[] = snap.empty
      ? []
      : snap.docs.map((d) => {
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

    const existingSlugs = new Set(dbCommunities.map((c) => c.slug.toLowerCase()));
    const missingDefaults: Community[] = [];

    for (const item of DEFAULT_COMMUNITIES) {
      if (!existingSlugs.has(item.slug.toLowerCase())) {
        missingDefaults.push({
          id: `seed-${item.slug}`,
          ...item,
          createdAt: new Date().toISOString(),
        });
        if (snap.empty) {
          addDoc(commRef, {
            ...item,
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }
      }
    }

    const all = [...dbCommunities, ...missingDefaults].sort(
      (a, b) => (b.memberCount || 0) - (a.memberCount || 0)
    );
    return all;
  } catch (err) {
    console.warn('Fallback to local default communities:', err);
    return DEFAULT_COMMUNITIES.map((c, i) => ({
      id: `default-${c.slug || i}`,
      ...c,
      createdAt: new Date().toISOString(),
    }));
  }
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

export const DEFAULT_POSTS: PostItem[] = [
  {
    id: 'post-exam-spring26',
    community: 'c/examination-cell',
    communityPrefix: 'c/',
    communityIconBg: '#8B5CF6',
    author: 'Office of Controller of Examinations',
    authorRole: 'Administrative Directorate',
    authorBadge: 'Dean Authenticated',
    authorBadgeType: 'official',
    title: 'End-Semester Examination Schedule & Seating Matrix Notification (Spring 2026)',
    content: 'The official timetable for all Undergraduate and Postgraduate engineering examinations is now ratified by the Academic Council.\n\n• Hall tickets will be downloadable via portal starting 15th Oct.\n• Minimum 75% biometric attendance required to generate seat allotment slips.\n• Timetable clash redressal window closes this Friday at 23:59 IST.\n• Mobile phones, smartwatches, and programmable electronics remain strictly barred from halls.',
    timestamp: '2h ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    pinned: true,
    pinnedLabel: 'OFFICIAL CIRCULAR',
    flairs: [
      { label: 'EXAMS 2026', bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6' },
      { label: 'CRITICAL', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
    ],
    categoryTier: 'ADMINISTRATIVE',
    docCode: 'EXAM/2026/S-401',
    upvotes: 342,
    commentsCount: 28,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'pdf',
      fileName: 'EndSem_Schedule_Spring2026_Final.pdf',
      fileSize: '2.4 MB',
      metaText: 'Official Circular · Ref: EXAM/2026/S-401',
      verifiedLabel: 'Dean Authenticated (Tier 1)',
    },
  },
  {
    id: 'post-robotics-rover-mk4',
    community: 'c/robotics-club',
    communityPrefix: 'c/',
    communityIconBg: '#FF6848',
    author: 'Arjun Mehta',
    authorRole: 'Lead Systems Architect',
    authorBadge: 'Makerspace Lead',
    authorBadgeType: 'tech',
    title: 'Autonomous Rover MK-IV passed outdoor GPS-denied obstacle navigation test! 🤖',
    content: 'After 3 weeks of continuous tuning of our ROS2 Nav2 stack and dual Intel RealSense D435 cameras with Livox mid-360 LiDAR, the MK-IV rover completed 1.2km of rough terrain traversing without human intervention!\n\nKey milestones achieved:\n1. Zero waypoint drift over rocky gravel slope.\n2. Dynamic local costmap update rate maintained at 25 Hz.\n3. Motor drivers drew a peak of only 18A on 24V LiFePO4 cells.',
    timestamp: '4h ago',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'HARDWARE', bg: 'rgba(255, 104, 72, 0.15)', text: '#FF6848' },
      { label: 'ROS2 NAV', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
    ],
    upvotes: 218,
    commentsCount: 16,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'hardware',
      metaText: 'Telemetry Log: Rover MK-IV Field Trial',
      telemetryStats: [
        { label: 'Navigation Stack', val: 'ROS2 Humble / Nav2' },
        { label: 'Battery Status', val: '24V LiFePO4 (96%)' },
        { label: 'LiDAR Sensor', val: 'Livox Mid-360 3D' },
        { label: 'Waypoint Err', val: '< 3.8 cm' },
      ],
    },
  },
  {
    id: 'post-ai-workshop-finetuning',
    community: 'c/ai-ml-society',
    communityPrefix: 'c/',
    communityIconBg: '#6366F1',
    author: 'Priya Nambiar',
    authorRole: 'Research Head · AI Society',
    authorBadge: 'Kaggle Master',
    authorBadgeType: 'tech',
    title: 'Hands-On Workshop: Fine-Tuning Open Source LLMs & Vision Models on Campus GPU Cluster',
    content: 'Calling all machine learning enthusiasts! We are hosting an intensive Saturday live-coding masterclass utilizing our department NVIDIA A100 GPU cluster.\n\nTopics covered:\n• LoRA & QLoRA parameter-efficient fine-tuning\n• Synthesizing clean domain datasets from academic papers\n• Quantizing models to GGUF format for local edge inference on Mac & laptop\n\nCloud compute credits & pizza provided to all participants.',
    timestamp: '6h ago',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'WORKSHOP', bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1' },
      { label: 'A100 CLUSTER', bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
    ],
    upvotes: 185,
    commentsCount: 22,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'workshop',
      fileName: 'AI_Workshop_Syllabus.pdf',
      metaText: 'Alan Turing Computing Hall (Lab 4B)',
      workshopDate: { month: 'OCT', day: '18' },
      workshopTime: '02:00 PM – 05:30 PM',
      workshopLocation: 'Alan Turing Computing Hall (Lab 4B)',
      workshopSeats: { total: 60, filled: 47 },
    },
  },
  {
    id: 'post-aerospace-sounding-rocket',
    community: 'c/aerospace-rocketry',
    communityPrefix: 'c/',
    communityIconBg: '#0284C7',
    author: 'Vikramaditya Rao',
    authorRole: 'Avionics & Propulsion Lead',
    authorBadge: 'Club President',
    authorBadgeType: 'tech',
    title: 'Project Astraeus-1: 3kN Solid Rocket Motor Static Fire Complete at Propulsion Bay 🚀',
    content: 'Our solid composite propellant motor completed its scheduled 4.2-second static burn on the university thrust test stand. Chamber pressure held rock-solid at 48.2 bar with zero nozzle erosion on the graphite insert.\n\nDual-redundant barometer avionics fired the recovery charge simulator at T+4.5s. We are greenlit for launch authorization to 3.5 km apogee next month!',
    timestamp: '8h ago',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'PROPULSION', bg: 'rgba(2, 132, 199, 0.15)', text: '#0284C7' },
      { label: 'AVIONICS', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
    ],
    upvotes: 276,
    commentsCount: 19,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'hardware',
      metaText: 'Thrust Stand Telemetry Log',
      telemetryStats: [
        { label: 'Peak Thrust', val: '3,210 N' },
        { label: 'Burn Duration', val: '4.25 s' },
        { label: 'Chamber Press', val: '48.2 Bar' },
        { label: 'Target Apogee', val: '3,500 m' },
      ],
    },
  },
  {
    id: 'post-formula-ev-racing',
    community: 'c/formula-student-racing',
    communityPrefix: 'c/',
    communityIconBg: '#EF4444',
    author: 'Karan Singhal',
    authorRole: 'Chief Engineer · Team Veloce Racing',
    authorBadge: 'FSAE Lead',
    authorBadgeType: 'tech',
    title: 'Custom Inverter & 400V Battery Pack Passed Thermal Endurance Testing on Dyno ⚡',
    content: 'Excited to announce that our 2026 EV racer accumulator completed 35 minutes of grueling high-speed endurance testing on the chassis dynamometer.\n\nCell temperatures peaked at 43.8°C (well below the 60°C safety margin) thanks to our in-house 3D printed water-glycol cooling jackets. Regenerative braking efficiency hit 91.2% on simulated hairpin corners!',
    timestamp: '11h ago',
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'FORMULA EV', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
      { label: 'DYNOMETER', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
    ],
    upvotes: 224,
    commentsCount: 14,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'hardware',
      metaText: 'Endurance Dyno Benchmark Log',
      telemetryStats: [
        { label: 'Pack Voltage', val: '398.4 V' },
        { label: 'Peak Power', val: '80 kW' },
        { label: 'Max Pack Temp', val: '43.8 °C' },
        { label: 'Regen Efficiency', val: '91.2%' },
      ],
    },
  },
  {
    id: 'post-hackathon-poll',
    community: 'c/hackathon-teams',
    communityPrefix: 'c/',
    communityIconBg: '#10B981',
    author: 'Sanya Malhotra',
    authorRole: 'Hackathon Coordinator',
    authorBadge: 'Community Builder',
    authorBadgeType: 'student',
    title: 'Smart India Hackathon & HackMIT 2026: Which track is your team targeting?',
    content: 'We already have 24 registered campus squads forming across disciplines! If you are a solo frontend developer, designer, or hardware hacker seeking a team, cast your vote below so we can introduce you to project leads.',
    timestamp: '14h ago',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'TEAM FINDER', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
      { label: 'HACKATHON', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
    ],
    upvotes: 198,
    commentsCount: 37,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'poll',
      metaText: '293 student votes recorded',
      pollOptions: [
        { id: '1', text: 'Healthcare & MedTech AI Diagnosis', votes: 112, percentage: 38 },
        { id: '2', text: 'Smart Clean Energy & EV Infrastructure', votes: 72, percentage: 25 },
        { id: '3', text: 'Autonomous Robotics & Edge Vision', votes: 68, percentage: 23 },
        { id: '4', text: 'FinTech, Open Banking & Crypto Security', votes: 41, percentage: 14 },
      ],
    },
  },
  {
    id: 'post-career-internships',
    community: 'c/career-placements',
    communityPrefix: 'c/',
    communityIconBg: '#F59E0B',
    author: 'Centre for Career Development',
    authorRole: 'CDC Central Office',
    authorBadge: 'Official Verification',
    authorBadgeType: 'official',
    title: 'Notice: Global Tech & Quantitative Finance Summer Internships Shortlist Released',
    content: 'The initial online technical assessment results for Google, Microsoft, Goldman Sachs, and D.E. Shaw 2026 summer internships have been validated.\n\nShortlisted applicants must confirm interview slot availability on the CDC portal before Thursday 5:00 PM and attend tomorrow\'s resume verification check.',
    timestamp: '18h ago',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'INTERNSHIPS', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
      { label: 'TIER-1 CDC', bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1' },
    ],
    upvotes: 310,
    commentsCount: 45,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'pdf',
      fileName: 'CDC_Shortlist_Phase1_Summer2026.pdf',
      fileSize: '1.8 MB',
      metaText: 'Office of Career Development · Ref: CDC/INT/429',
      verifiedLabel: 'Verified CDC Circular',
    },
  },
  {
    id: 'post-coding-segment-trees',
    community: 'c/coding-algorithms',
    communityPrefix: 'c/',
    communityIconBg: '#3B82F6',
    author: 'Devansh Gupta',
    authorRole: 'Competitive Programming Lead',
    authorBadge: 'Candidate Master',
    authorBadgeType: 'tech',
    title: 'Weekly Algorithmic Clash #42 Editorial & Code Breakdown: Segment Trees with Lazy Propagation',
    content: 'Great turnout of 165 coders in yesterday\'s algorithmic clash! Problem D proved to be the differentiator. Here is our detailed editorial explaining how iterative segment trees prevent recursive call-stack overflow on deep tree queries with O(log N) updates.',
    timestamp: '1d ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'ALGORITHMS', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
      { label: 'ICPC PREP', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
    ],
    upvotes: 142,
    commentsCount: 15,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
  },
  {
    id: 'post-cyber-ctf-writeup',
    community: 'c/cybersecurity-ctf',
    communityPrefix: 'c/',
    communityIconBg: '#14B8A6',
    author: 'Rohan Varma',
    authorRole: 'CTF Team Captain · 3rd Year InfoSec',
    authorBadge: 'Security Researcher',
    authorBadgeType: 'tech',
    title: 'We placed Top 5 in National Inter-University Cyber Shield CTF! Full Writeups Published 🛡️',
    content: 'Our team cracked 24 out of 26 flags across kernel heap pwn, blind SQL injection, and quantum-resistant lattice crypto challenges.\n\nWe wrote an in-depth walkthrough on how we exploited the custom ARM64 firmware challenge using return-oriented programming (ROP chains). Full reproduction scripts are uploaded to the lab repo.',
    timestamp: '1d ago',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'CYBERSECURITY', bg: 'rgba(20, 184, 166, 0.15)', text: '#14B8A6' },
      { label: 'ROP CHAINS', bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6' },
    ],
    upvotes: 189,
    commentsCount: 18,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
  },
  {
    id: 'post-music-sunset-jam',
    community: 'c/music-sound-society',
    communityPrefix: 'c/',
    communityIconBg: '#F43F5E',
    author: 'Ananya Roy',
    authorRole: 'Sound Society Convenor',
    authorBadge: 'Performer',
    authorBadgeType: 'student',
    title: 'Campus Sunset Acoustic & Modular Synth Jam — Friday 6:30 PM at Open Air Amphitheatre 🎶',
    content: 'Bring your acoustic guitars, violins, saxophones, or MIDI gear! We have set up a 16-channel analog mixing console, dual monitor wedges, and stereo reverb pedals.\n\nFree admission, warm tea, and impromptu student collaborations. Jam slots are first-come, first-served!',
    timestamp: '2d ago',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'LIVE MUSIC', bg: 'rgba(244, 63, 94, 0.15)', text: '#F43F5E' },
      { label: 'JAM NIGHT', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
    ],
    upvotes: 247,
    commentsCount: 31,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
    attachment: {
      type: 'workshop',
      metaText: 'Central Campus Open Air Amphitheatre',
      workshopDate: { month: 'OCT', day: '24' },
      workshopTime: '06:30 PM – 09:30 PM',
      workshopLocation: 'Central Campus Open Air Amphitheatre',
      workshopSeats: { total: 250, filled: 168 },
    },
  },
  {
    id: 'post-design-visual-fest',
    community: 'c/design-arts-guild',
    communityPrefix: 'c/',
    communityIconBg: '#EC4899',
    author: 'Mira Sen',
    authorRole: 'Design Guild Lead',
    authorBadge: 'Art Director',
    authorBadgeType: 'student',
    title: 'Open Call: Submissions for the 2026 Campus Cultural & Tech Fest Visual Identity 🎨',
    content: 'We are officially crowdsourcing branding submissions for the upcoming Annual Collegiate Symposium. Looking for bold 3D motion loops, typography posters, and generative SVG badges.\n\nWinners will have their designs featured across main stage LED walls, commemorative hoodies, and official portal banners.',
    timestamp: '2d ago',
    createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'CREATIVE', bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899' },
      { label: 'IDENTITY', bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6' },
    ],
    upvotes: 165,
    commentsCount: 12,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
  },
  {
    id: 'post-ecell-micro-grants',
    community: 'c/entrepreneurship-cell',
    communityPrefix: 'c/',
    communityIconBg: '#D97706',
    author: 'E-Cell Incubation Team',
    authorRole: 'Venture Hub Coordinator',
    authorBadge: 'Incubation Admin',
    authorBadgeType: 'official',
    title: 'Applications Open: $10,000 Campus Prototype Seed Fund & Cohort 2026 💡',
    content: 'Building a deep-tech hardware prototype, AI agent, or campus utility? E-Cell is accepting applications for the 2026 Incubation Cohort.\n\nSelected teams receive equity-free prototyping capital, dedicated desk space in the Makerspace, legal incorporation help, and monthly 1-on-1 advisory with alumni venture capitalists.',
    timestamp: '3d ago',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    flairs: [
      { label: 'VENTURE HUB', bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706' },
      { label: 'SEED GRANTS', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
    ],
    upvotes: 231,
    commentsCount: 26,
    hasUserUpvoted: false,
    hasUserDownvoted: false,
    isSaved: false,
  },
];


const DEFAULT_COMMENTS_MAP: Record<string, Omit<CommentItem, 'id' | 'postId'>[]> = {
  'post-exam-spring26': [
    {
      author: 'Rohit Kulkarni',
      authorRole: '3rd Year ECE',
      content: 'Can someone confirm if the attendance cutoff includes medical leave waivers submitted to the Dean office last week?',
      timestamp: '1h ago',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      upvotes: 8,
    },
    {
      author: 'Office of Controller of Examinations',
      authorRole: 'Admin Official',
      content: 'Medical leaves sanctioned before 10th Oct are already reconciled in the portal database. Please check your SIS dashboard.',
      timestamp: '45m ago',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      upvotes: 14,
    },
  ],
  'post-robotics-rover-mk4': [
    {
      author: 'Sameer Sen',
      authorRole: '2nd Year Mechatronics',
      content: 'Incredible work on the Livox LiDAR pointcloud filter! Are you guys open-sourcing the custom costmap plugin on GitHub?',
      timestamp: '2h ago',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      upvotes: 11,
    },
    {
      author: 'Arjun Mehta',
      authorRole: 'Lead Systems Architect',
      content: 'Yes! Repo will be pushed to the university GitHub org right after the inter-collegiate review next Tuesday.',
      timestamp: '1h ago',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      upvotes: 19,
    },
  ],
  'post-ai-workshop-finetuning': [
    {
      author: 'Tanvi Joshi',
      authorRole: '1st Year Data Science',
      content: 'Do we need prior experience with PyTorch, or is basic Python enough for the hands-on session?',
      timestamp: '3h ago',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      upvotes: 7,
    },
    {
      author: 'Priya Nambiar',
      authorRole: 'Research Head · AI Society',
      content: 'Basic Python is totally fine! We provide pre-configured Jupyter notebook environments with all CUDA dependencies pre-installed.',
      timestamp: '2h ago',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      upvotes: 15,
    },
  ],
  'post-formula-ev-racing': [
    {
      author: 'Aditya Nair',
      authorRole: '3rd Year Mechanical',
      content: '43.8°C maximum pack temperature under full dyno pull is phenomenal. Did you mill the cooling channels or laser-weld aluminum plates?',
      timestamp: '5h ago',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      upvotes: 9,
    },
    {
      author: 'Karan Singhal',
      authorRole: 'Chief Engineer · Team Veloce Racing',
      content: 'We used 3D printed nylon manifolds coupled to extruded micro-channel aluminum tubes. Saved 1.8 kg compared to the 2025 iteration!',
      timestamp: '3h ago',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      upvotes: 18,
    },
  ],
};


export async function listPosts(params?: {
  community?: string;
  communitySlug?: string;
  sort?: 'hot' | 'new' | 'top';
  limitCount?: number;
  currentUserId?: string;
}): Promise<PostItem[]> {
  const postsRef = collection(db, 'posts');
  let dbPosts: PostItem[] = [];

  try {
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(params?.limitCount || 30));
    if (params?.sort === 'top') {
      q = query(postsRef, orderBy('upvotes', 'desc'), limit(params?.limitCount || 30));
    }
    const snap = await getDocs(q);

    if (!snap.empty) {
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const { display, iso } = formatTimestamp(data.createdAt);
        const postCommunity = data.community || 'Campus Feed';
        const postCommunitySlug = data.communitySlug || postCommunity.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-');

        dbPosts.push({
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
    }
  } catch (err) {
    console.warn('Firestore posts query error, serving demo posts:', err);
  }

  // Combine with rich demo posts to ensure feed is always fully populated
  const existingIds = new Set(dbPosts.map((p) => p.id));
  const existingTitles = new Set(dbPosts.map((p) => p.title.toLowerCase().trim()));

  const missingDemoPosts: PostItem[] = [];
  for (const demo of DEFAULT_POSTS) {
    if (!existingIds.has(demo.id) && !existingTitles.has(demo.title.toLowerCase().trim())) {
      missingDemoPosts.push(demo);
    }
  }

  let combinedPosts = [...dbPosts, ...missingDemoPosts];

  // Apply community filter if requested
  const filterCommunity = params?.community || params?.communitySlug;
  if (filterCommunity && filterCommunity !== 'all' && filterCommunity !== 'all-campus') {
    const cleanTarget = filterCommunity.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-').replace(/_/g, '-');
    combinedPosts = combinedPosts.filter((p) => {
      const pComm = p.community.toLowerCase().replace(/^c\//, '').replace(/\s+/g, '-').replace(/_/g, '-');
      return pComm === cleanTarget || pComm.includes(cleanTarget) || cleanTarget.includes(pComm);
    });
  }

  // Apply sorting
  if (params?.sort === 'top') {
    combinedPosts.sort((a, b) => b.upvotes - a.upvotes);
  } else if (params?.sort === 'new') {
    combinedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } else {
    // Hot sort: score based on upvotes and recent timestamp
    combinedPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.upvotes - a.upvotes;
    });
  }

  // Hydrate user vote and bookmark states if authenticated
  if (params?.currentUserId && combinedPosts.length > 0) {
    const uid = params.currentUserId;
    await Promise.all(
      combinedPosts.map(async (p) => {
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
          // Ignore hydration error for offline/demo posts
        }
      })
    );
  }

  return combinedPosts;
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
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
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
  } catch (err) {
    console.warn('Firestore comments load error, checking demo replies:', err);
  }

  // Return realistic demo comments if empty
  const defaults = DEFAULT_COMMENTS_MAP[postId] || [
    {
      author: 'Ananya Sharma',
      authorRole: 'Student Contributor',
      content: 'Thanks for sharing this update! Really glad to see this progressing.',
      timestamp: '2h ago',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      upvotes: 4,
    },
    {
      author: 'Kavita Menon',
      authorRole: 'Peer Moderator',
      content: 'Shared this with our study circle group on the portal as well.',
      timestamp: '1h ago',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      upvotes: 2,
    },
  ];

  return defaults.map((item, idx) => ({
    id: `demo-comm-${postId}-${idx}`,
    postId,
    ...item,
  }));
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
