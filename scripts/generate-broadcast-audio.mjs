import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '..', '.env');
let geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*['"]?([^'"\r\n]+)['"]?/);
  if (match) {
    geminiApiKey = match[1];
  }
}

if (!geminiApiKey) {
  console.error("❌ Error: GEMINI_API_KEY not found in environment variables or .env file.");
  process.exit(1);
} else {
  console.log(`🔑 Loaded API key length: ${geminiApiKey.length}, starts with: ${geminiApiKey.substring(0, 8)}, ends with: ${geminiApiKey.substring(geminiApiKey.length - 8)}`);
}

const transcriptPath = path.join(__dirname, '..', 'khu-notices-2026-07', 'week5_broadcast_transcription_ko_enhanced.md');
if (!fs.existsSync(transcriptPath)) {
  console.error(`❌ Error: Transcript file not found at ${transcriptPath}`);
  process.exit(1);
}

console.log(`📖 Reading transcript from: ${transcriptPath}`);
const content = fs.readFileSync(transcriptPath, 'utf8');
const lines = content.split('\n');
const dialogue = [];
let currentSpeaker = null;
let currentText = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('**앵커:**')) {
    if (currentSpeaker && currentText.length > 0) {
      dialogue.push({ speaker: currentSpeaker, text: currentText.join(' ').trim() });
    }
    currentSpeaker = 'Anchor';
    currentText = [];
  } else if (trimmed.startsWith('**리포터:**') || trimmed.startsWith('**리포터들:**')) {
    if (currentSpeaker && currentText.length > 0) {
      dialogue.push({ speaker: currentSpeaker, text: currentText.join(' ').trim() });
    }
    currentSpeaker = 'Reporter';
    currentText = [];
  } else if (trimmed.startsWith('##') || trimmed.startsWith('---') || trimmed.startsWith('*생성됨:')) {
    if (currentSpeaker && currentText.length > 0) {
      dialogue.push({ speaker: currentSpeaker, text: currentText.join(' ').trim() });
    }
    currentSpeaker = null;
    currentText = [];
  } else if (currentSpeaker && trimmed) {
    currentText.push(trimmed);
  }
}
if (currentSpeaker && currentText.length > 0) {
  dialogue.push({ speaker: currentSpeaker, text: currentText.join(' ').trim() });
}

if (dialogue.length === 0) {
  console.error("❌ Error: Parsed dialogue is empty.");
  process.exit(1);
}

console.log(`📝 Parsed ${dialogue.length} lines of dialogue.`);

// Build conversation prompt
const speakerList = [...new Set(dialogue.map((d) => d.speaker))].join(' and ');
const dialogueLines = dialogue.map((d) => `${d.speaker}: ${d.text}`).join('\n');
const prompt = `TTS the following conversation between ${speakerList}:\n${dialogueLines}`;

console.log('\n--- Dialogue Preview ---');
console.log(dialogueLines.substring(0, 300) + '...\n------------------------');

// Call Gemini API via direct fetch (robust support for new AQ. API keys)
const speakers = [
  { name: 'Anchor', voiceName: 'Kore' },
  { name: 'Reporter', voiceName: 'Puck' }
];

const speakerVoiceConfigs = speakers.map((speaker) => ({
  speaker: speaker.name,
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: speaker.voiceName,
    },
  },
}));

const body = {
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: speakerVoiceConfigs,
      },
    },
  },
};

const outputPath = path.join(__dirname, '..', 'khu-notices-2026-07', 'week5_broadcast_audio.wav');

async function run() {
  try {
    console.log('🎙️ Calling Gemini TTS API via direct fetch...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${geminiApiKey}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error(`Failed to generate audio. Response structure: ${JSON.stringify(data, null, 2)}`);
    }

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
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n✅ Audio generated successfully! Saved to: ${outputPath}`);
    console.log(`Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Error during audio generation:', error.message || error);
    process.exit(1);
  }
}

run();
