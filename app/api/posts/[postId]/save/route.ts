import { NextRequest, NextResponse } from 'next/server';
import { toggleSavePost } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const userHandle = body.userHandle || 'u/ananya_s';

    const result = await toggleSavePost(postId, userHandle);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error toggling save:', error);
    return NextResponse.json({ error: 'Failed to toggle save state' }, { status: 500 });
  }
}
