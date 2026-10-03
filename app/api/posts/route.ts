import { NextRequest, NextResponse } from 'next/server';
import { fetchServerPosts, insertServerPost } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const community = searchParams.get('community') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as 'hot' | 'new' | 'top') || 'hot';
    const userHandle = searchParams.get('userHandle') || 'u/ananya_s';

    const posts = await fetchServerPosts({ community, search, sort, userHandle });
    return NextResponse.json({ posts, count: posts.length });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to retrieve posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, community, author, authorRole, flairs, attachment } = body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Post title is required and must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (title.trim().length > 300) {
      return NextResponse.json(
        { error: 'Post title cannot exceed 300 characters.' },
        { status: 400 }
      );
    }

    if (!community || typeof community !== 'string') {
      return NextResponse.json(
        { error: 'A destination community must be selected.' },
        { status: 400 }
      );
    }

    const postContent = typeof content === 'string' && content.trim() ? content.trim() : 'No additional text provided.';

    const newPost = await insertServerPost({
      title: title.trim(),
      content: postContent,
      community: community.trim(),
      author: author || 'u/ananya_s',
      authorRole: authorRole || 'Student',
      flairs,
      attachment,
    });

    return NextResponse.json({ post: newPost, message: 'Post published successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to publish post to server' }, { status: 500 });
  }
}
