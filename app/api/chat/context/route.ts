import { NextRequest, NextResponse } from 'next/server';
import { retrieveCampusContext } from '@/lib/campusContext';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const context = await retrieveCampusContext(query);
    return NextResponse.json(context);
  } catch (error: any) {
    console.error('Error retrieving campus context:', error);
    return NextResponse.json({ error: 'Failed to retrieve context' }, { status: 500 });
  }
}
