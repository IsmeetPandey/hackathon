import { NextRequest, NextResponse } from 'next/server';
import { getServerNotices, insertServerNotice } from '@/lib/serverStore';

export async function GET() {
  try {
    const notices = await getServerNotices();
    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    return NextResponse.json({ error: 'Failed to retrieve notices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, source, officerName, category, documentDate, summaryBullets, extractedText, fileName, fileSize, targetAudience, channels } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Notice title is required' }, { status: 400 });
    }

    const notice = await insertServerNotice({
      title: title.trim(),
      source: source || 'c/examination_cell',
      officerName: officerName || 'Dr. V. Ramanathan (Controller of Examinations)',
      category: category || 'TIER 1 · INSTITUTIONAL',
      documentDate,
      summaryBullets: Array.isArray(summaryBullets) && summaryBullets.length > 0 ? summaryBullets : undefined,
      extractedText,
      fileName,
      fileSize,
      targetAudience,
      channels,
    });

    return NextResponse.json({ notice, message: 'Notice broadcasted successfully across channels' }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving notice:', error);
    return NextResponse.json({ error: 'Failed to ingest circular notice' }, { status: 500 });
  }
}
