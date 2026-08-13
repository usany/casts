import { generateMultiSpeakerAudio } from '@/app/lib/gemini-tts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { speakers, prompt } = body;

    // Validate input
    if (!speakers || !Array.isArray(speakers) || speakers.length === 0) {
      return NextResponse.json(
        { error: 'speakers array is required and must contain at least 1 speaker' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt (string) is required' },
        { status: 400 }
      );
    }

    if (speakers.length > 2) {
      return NextResponse.json(
        { error: 'Multi-speaker TTS supports up to 2 speakers' },
        { status: 400 }
      );
    }

    // Validate speaker structure
    for (const speaker of speakers) {
      if (!speaker.name || !speaker.voiceName) {
        return NextResponse.json(
          { error: 'Each speaker must have "name" and "voiceName" properties' },
          { status: 400 }
        );
      }
    }

    // Generate audio
    const audioBuffer = await generateMultiSpeakerAudio({
      speakers,
      prompt,
    });

    // Return audio as response
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="output.wav"',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate audio',
      },
      { status: 500 }
    );
  }
}
