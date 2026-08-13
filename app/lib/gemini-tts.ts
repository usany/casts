import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { AVAILABLE_VOICES, PrebuiltVoice } from './voices';

interface SpeakerConfig {
  name: string;
  voiceName: string;
}

interface MultiSpeakerTTSOptions {
  speakers: SpeakerConfig[];
  prompt: string;
  outputPath?: string;
}

/**
 * Generate multi-speaker audio using Google Gemini API
 * Supports up to 2 speakers with different voices
 */
export async function generateMultiSpeakerAudio(
  options: MultiSpeakerTTSOptions
): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set');
  }

  const client = new GoogleGenerativeAI(apiKey);

  // Validate speaker count (max 2)
  if (options.speakers.length > 2) {
    throw new Error('Multi-speaker TTS supports up to 2 speakers');
  }

  if (options.speakers.length === 0) {
    throw new Error('At least one speaker is required');
  }

  // Build speaker voice configurations
  const speakerVoiceConfigs = options.speakers.map((speaker) => ({
    speaker: speaker.name,
    voice_config: {
      prebuilt_voice_config: {
        voice_name: speaker.voiceName,
      },
    },
  }));

  const config = {
    response_modalities: ['AUDIO'],
    speech_config: {
      multi_speaker_voice_config: {
        speaker_voice_configs: speakerVoiceConfigs,
      },
    },
  };

  const response = await client
    .getGenerativeModel({ model: 'gemini-3.1-flash-tts-preview' })
    .generateContent({
      contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
      generationConfig: config as any,
    });

  const audioData =
    response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    throw new Error('Failed to generate audio from Gemini API');
  }

  // Convert to Buffer
  const rawPcm = Buffer.from(audioData, 'base64');

  // Prepend 44-byte WAV header for 24kHz Mono 16-bit PCM
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(rawPcm.length + 36, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // Linear PCM
  wavHeader.writeUInt16LE(1, 22); // Mono channel
  wavHeader.writeUInt32LE(24000, 24); // 24 kHz
  wavHeader.writeUInt32LE(24000 * 1 * 2, 28); // Byte rate
  wavHeader.writeUInt16LE(2, 32); // Block align
  wavHeader.writeUInt16LE(16, 34); // 16-bit
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(rawPcm.length, 40);

  const buffer = Buffer.concat([wavHeader, rawPcm]);

  // Save to file if output path is provided
  if (options.outputPath) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
    fs.writeFileSync(options.outputPath, buffer);
    console.log(`Audio saved to: ${options.outputPath}`);
  }

  return buffer;
}

/**
 * Helper function to create a conversation prompt
 */
export function createConversationPrompt(
  conversations: Array<{ speaker: string; text: string }>
): string {
  const speakerList = [...new Set(conversations.map((c) => c.speaker))].join(
    ' and '
  );
  const dialogueLines = conversations
    .map((c) => `${c.speaker}: ${c.text}`)
    .join('\n');

  return `TTS the following conversation between ${speakerList}:\n${dialogueLines}`;
}


