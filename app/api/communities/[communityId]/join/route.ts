import { NextRequest, NextResponse } from 'next/server';
import { toggleCommunityMembership } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const userHandle = body.userHandle || 'u/ananya_s';

    const decodedId = decodeURIComponent(communityId);
    const result = await toggleCommunityMembership(decodedId, userHandle);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error toggling community membership:', error);
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
  }
}
