import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { retrieveCampusContext } from '@/lib/campusContext';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, message } = body;

    const userPrompt =
      typeof message === 'string'
        ? message
        : Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1].content
        : '';

    // Safeguard: Input validation
    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    if (userPrompt.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long. Please keep questions under 1000 characters.' },
        { status: 400 }
      );
    }

    // Step A: Dynamically retrieve grounded campus records from Firestore
    const { records, summaryText } = await retrieveCampusContext(userPrompt);

    const apiKey = process.env.GEMINI_API_KEY;

    // Step B: Invoke Gemini with grounded Firestore context
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const conciseSystemInstruction = `You are "CampusAI", the grounded campus briefing engine for CampusConnect.

CORE BEHAVIORAL RULES:
1. Grounding: Answer user questions strictly using the "VERIFIED FIRESTORE CAMPUS RECORDS" provided below.
2. If no verified records exist for a specific inquiry, respond concisely: "I don't have verified campus data for that in our active database." Do NOT invent dates, rooms, circulars, or policies.
3. For campus briefings ("catch me up" / "briefing"):
Always structure into 3 distinct bullet points:
- **Important Today**: 1 official circular directive or deadline from records.
- **Coming Up**: 1 event, workshop, or milestone.
- **Active Spaces**: 1 community or project update.
4. Tone: Helpful, direct, concise, student-focused. Keep response under 160 words.

VERIFIED FIRESTORE CAMPUS RECORDS FOR THIS QUERY:
${summaryText || 'NO_VERIFIED_RECORDS'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction: conciseSystemInstruction,
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        });

        const replyText = response.text || "I don't have verified campus data for that in our active database.";
        return NextResponse.json({
          reply: replyText,
          sourcesCount: records.length,
          grounded: records.length > 0,
        });
      } catch (geminiError: any) {
        console.warn('Gemini API call error:', geminiError?.message || geminiError);
      }
    }

    // Deterministic fallback using only actual retrieved Firestore records
    if (records.length > 0) {
      const topRecord = records[0];
      const additional = records.slice(1, 3).map((r) => `• **${r.title}**: ${r.details}`).join('\n');

      const groundedReply = `📚 **Campus Notice & Record:**\n\n**${topRecord.title}**\n${topRecord.details}\n*(Source: ${topRecord.source})*\n\n${additional ? `**Related Records:**\n${additional}` : ''}`;

      return NextResponse.json({
        reply: groundedReply,
        sourcesCount: records.length,
        grounded: true,
      });
    }

    return NextResponse.json({
      reply: "I don't have verified campus data for that in our active database.",
      sourcesCount: 0,
      grounded: false,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { reply: "I'm having a momentary hiccup connecting to the campus database. Please try asking again in a moment!" },
      { status: 200 }
    );
  }
}
