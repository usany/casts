# Multi-Speaker TTS Implementation

Generate natural-sounding multi-speaker audio conversations using Google Gemini API's text-to-speech capabilities.

## Features

- **Multi-Speaker Support**: Up to 2 speakers with different voices
- **Multiple Voices**: 8 prebuilt voices (Kore, Puck, Breeze, Juniper, Chime, Echo, Orbit, Sage)
- **Three Usage Methods**:
  1. Web UI - Interactive component for generating audio
  2. API Route - REST endpoint for integration
  3. CLI Script - Command-line tool for batch processing

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs the `@google/generative-ai` package required for the Gemini API.

### 2. Set Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

Get your API key from [Google AI Studio](https://ai.google.dev).

## Usage

### Method 1: Web UI

Start the development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000/tts` to access the interactive multi-speaker TTS generator.

**Features:**
- Quick load example conversations
- Add/remove speakers dynamically (up to 2)
- Select from 8 prebuilt voices
- Real-time audio preview and download

### Method 2: API Route

Send a POST request to `/api/tts/multi-speaker`:

```bash
curl -X POST http://localhost:3000/api/tts/multi-speaker \
  -H "Content-Type: application/json" \
  -d '{
    "speakers": [
      {"name": "Joe", "voiceName": "Kore"},
      {"name": "Jane", "voiceName": "Puck"}
    ],
    "prompt": "Joe: Hello! Jane: Hi there!"
  }' \
  -o output.wav
```

**Request Body:**
- `speakers` (array, required): Array of speaker configs
  - `name` (string): Speaker name (used in prompt)
  - `voiceName` (string): Prebuilt voice name
- `prompt` (string, required): Conversation text

**Response:**
- `Content-Type: audio/wav` - WAV audio file

### Method 3: CLI Script

```bash
# Generate from text prompt
npm run tts:multi-speaker \
  --speakers '[{"name":"Joe","voiceName":"Kore"},{"name":"Jane","voiceName":"Puck"}]' \
  --prompt "Joe: How's it going? Jane: Great, thanks!" \
  --output conversation.wav

# Generate from file
npm run tts:multi-speaker \
  --speakers '[{"name":"Agent","voiceName":"Sage"},{"name":"Customer","voiceName":"Breeze"}]' \
  --file prompt.txt \
  --output support.wav

# Show help
npm run tts:multi-speaker -- --help
```

## Available Voices

All voices are from Google's Gemini TTS model:

| Voice    | Description      |
|----------|------------------|
| Kore     | Male voice       |
| Puck     | Female voice     |
| Breeze   | Calm voice       |
| Juniper  | Energetic voice  |
| Chime    | Bright voice     |
| Echo     | Deep voice       |
| Orbit    | Neutral voice    |
| Sage     | Professional voice |

## Code Examples

### Using the TypeScript Library

```typescript
import { generateMultiSpeakerAudio } from '@/app/lib/gemini-tts';

const audioBuffer = await generateMultiSpeakerAudio({
  speakers: [
    { name: 'Alice', voiceName: 'Breeze' },
    { name: 'Bob', voiceName: 'Echo' },
  ],
  prompt: `Alice: What's your favorite color?
Bob: I like blue. What about you?
Alice: Blue is great! I prefer green though.`,
  outputPath: 'conversation.wav',
});
```

### Creating Conversation Prompts

```typescript
import { createConversationPrompt } from '@/app/lib/gemini-tts';

const prompt = createConversationPrompt([
  { speaker: 'Joe', text: "How's it going today Jane?" },
  { speaker: 'Jane', text: 'Not too bad, how about you?' },
]);
```

## Prompt Format

When creating prompts, use the speaker names clearly:

```
Speaker1: First message
Speaker2: Response
Speaker1: Next message
Speaker2: Another response
```

Example:
```
Joe: How's it going today Jane?
Jane: Not too bad, how about you?
Joe: I'm doing pretty well, thanks for asking!
Jane: That's great to hear!
```

## Limitations

- **Max Speakers**: 2 speakers per audio generation
- **API Model**: Uses `gemini-3.1-flash-tts-preview`
- **Output Format**: WAV audio
- **Sample Rate**: 24000 Hz
- **Channels**: Mono (1 channel)

## File Structure

```
casts/
├── app/
│   ├── api/
│   │   └── tts/
│   │       └── multi-speaker/
│   │           └── route.ts          # API endpoint
│   ├── components/
│   │   └── MultiSpeakerTTS.tsx        # React UI component
│   ├── lib/
│   │   └── gemini-tts.ts              # Core library
│   └── tts/
│       └── page.tsx                    # Web UI page
├── scripts/
│   └── generate-multi-speaker-tts.mjs  # CLI script
├── .env.local                          # Environment variables
└── package.json
```

## Troubleshooting

### "GOOGLE_API_KEY environment variable is not set"
Make sure you've created `.env.local` with your API key:
```env
GOOGLE_API_KEY=your_key_here
```

### "Failed to generate audio from Gemini API"
- Verify your API key is valid
- Check that speakers match the names used in the prompt
- Ensure the prompt is not empty

### API errors when calling the endpoint
- Check that all required fields are provided
- Verify speaker names in the prompt match the speaker config
- Ensure speaker count doesn't exceed 2

## API Documentation

### POST /api/tts/multi-speaker

Generates multi-speaker audio from a conversation prompt.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "speakers": [
    {
      "name": "string",      // Speaker identifier (used in prompt)
      "voiceName": "string"  // Voice from AVAILABLE_VOICES
    }
  ],
  "prompt": "string"  // Conversation text
}
```

**Success Response (200):**
```
Content-Type: audio/wav
Content-Disposition: attachment; filename="output.wav"
[Binary WAV data]
```

**Error Response (400/500):**
```json
{
  "error": "Error message describing what went wrong"
}
```

## Performance Notes

- First request may take 5-15 seconds as the model processes the request
- Subsequent requests are similar duration (no caching)
- Audio quality improves with more context in the prompt
- Shorter dialogues process faster than longer conversations

## Advanced Usage

### Batch Processing

Process multiple conversations:

```bash
# Create a prompt file
cat > prompts.txt << 'EOF'
Agent: Welcome to support
Customer: Hi, I have an issue
EOF

npm run tts:multi-speaker \
  --speakers '[{"name":"Agent","voiceName":"Sage"},{"name":"Customer","voiceName":"Breeze"}]' \
  --file prompts.txt \
  --output batch1.wav
```

### Integration with Next.js

```typescript
// pages/api/podcast/generate.ts
import { generateMultiSpeakerAudio } from '@/app/lib/gemini-tts';

export default async function handler(req, res) {
  const { speakers, prompt } = req.body;
  
  const audio = await generateMultiSpeakerAudio({
    speakers,
    prompt,
  });
  
  res.setHeader('Content-Type', 'audio/wav');
  res.send(audio);
}
```

## Next Steps

- Explore different voice combinations for your use case
- Integrate with your podcast or content platform
- Add audio processing (compression, normalization)
- Store generated audio in cloud storage (S3, etc.)
- Build a playlist or episode manager

## Support

For issues with the Google Gemini API, refer to:
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Speech Generation Guide](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation)
