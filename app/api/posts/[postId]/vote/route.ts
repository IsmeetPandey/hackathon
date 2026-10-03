import { NextRequest, NextResponse } from 'next/server';
import { recordPostVote } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const body = await req.json();
    const { voteType, userHandle } = body;

    if (voteType !== 'up' && voteType !== 'down') {
      return NextResponse.json({ error: 'voteType must be "up" or "down"' }, { status: 400 });
    }

    const handle = userHandle || 'u/ananya_s';
    const result = await recordPostVote(postId, handle, voteType);

    if (!result.success) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
