-- College Connect: Production Supabase Schema
-- Run this in your Supabase SQL Editor or migration pipeline.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (syncs with auth.users or standalone academic credentials)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  email TEXT,
  avatar_url TEXT,
  karma TEXT DEFAULT '100 karma',
  role TEXT DEFAULT 'student',
  department TEXT DEFAULT 'General Academic',
  roll_number TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Communities Table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  prefix TEXT DEFAULT 'c/',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'commons',
  tier TEXT DEFAULT 'Tier 3 Commons',
  icon_bg TEXT DEFAULT 'bg-blue-600',
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Community Memberships Table
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_handle TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_community UNIQUE(community_id, user_handle)
);

-- 4. Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_slug TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_role TEXT DEFAULT 'student',
  author_badge TEXT,
  author_badge_type TEXT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  pinned_label TEXT,
  category_tier TEXT,
  doc_code TEXT,
  upvotes INT DEFAULT 1,
  comments_count INT DEFAULT 0,
  flairs JSONB DEFAULT '[]'::jsonb,
  attachment JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Post Votes Table
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_handle TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_post_vote UNIQUE(post_id, user_handle)
);

-- 6. Saved Posts Table
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_handle TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_saved_post UNIQUE(post_id, user_handle)
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_handle TEXT NOT NULL,
  author_role TEXT,
  content TEXT NOT NULL CHECK (char_length(trim(content)) >= 1),
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Official Notices Table (Administrative Ingestion Desk)
CREATE TABLE IF NOT EXISTS official_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  officer_name TEXT NOT NULL,
  category TEXT DEFAULT 'TIER 1 · INSTITUTIONAL',
  document_date TEXT NOT NULL,
  summary_bullets JSONB NOT NULL,
  extracted_text TEXT,
  file_name TEXT,
  file_size TEXT,
  status TEXT DEFAULT 'broadcasted',
  target_audience TEXT,
  channels JSONB DEFAULT '["c/examination_cell", "c/all-campus"]'::jsonb,
  published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal feed performance
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_handle);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_notices ENABLE ROW LEVEL SECURITY;

-- Read policies: public readable for collegiate community
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Public read memberships" ON community_members FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON post_votes FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read notices" ON official_notices FOR SELECT USING (true);

-- Insert policies: allow insert
CREATE POLICY "Insert posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert votes" ON post_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert memberships" ON community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert saved posts" ON saved_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert notices" ON official_notices FOR INSERT WITH CHECK (true);
