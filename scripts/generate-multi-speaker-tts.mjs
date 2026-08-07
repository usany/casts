#!/usr/bin/env node

import { generateMultiSpeakerAudio, createConversationPrompt } from '../app/lib/gemini-tts.js';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Multi-Speaker TTS Generator CLI

Usage: node generate-multi-speaker-tts.mjs [options]

Options:
  --speakers <json>     JSON array of speaker configs, e.g. '[{"name":"Joe","voiceName":"Kore"},{"name":"Jane","voiceName":"Puck"}]'
  --prompt <text>       The text prompt for the conversation
  --file <path>         Read prompt from a file
  --output <path>       Output file path (default: output.wav)
  --help, -h           Show this help message

Examples:
  # Generate from arguments
  node generate-multi-speaker-tts.mjs \\
    --speakers '[{"name":"Joe","voiceName":"Kore"},{"name":"Jane","voiceName":"Puck"}]' \\
    --prompt "Joe: Hello! Jane: Hi there!" \\
    --output audio.wav

  # Generate from file
  node generate-multi-speaker-tts.mjs \\
    --speakers '[{"name":"Joe","voiceName":"Kore"},{"name":"Jane","voiceName":"Puck"}]' \\
    --file prompt.txt \\
    --output audio.wav
  `);
  process.exit(0);
}

async function main() {
  try {
    // Parse arguments
    let speakers = null;
    let prompt = '';
    let outputPath = 'output.wav';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--speakers' && i + 1 < args.length) {
        try {
          speakers = JSON.parse(args[i + 1]);
        } catch (e) {
          console.error('Invalid JSON for --speakers:', args[i + 1]);
          process.exit(1);
        }
        i++;
      } else if (args[i] === '--prompt' && i + 1 < args.length) {
        prompt = args[i + 1];
        i++;
      } else if (args[i] === '--file' && i + 1 < args.length) {
        prompt = fs.readFileSync(args[i + 1], 'utf-8');
        i++;
      } else if (args[i] === '--output' && i + 1 < args.length) {
        outputPath = args[i + 1];
        i++;
      }
    }

    // Validate inputs
    if (!speakers) {
      console.error('Error: --speakers argument is required');
      process.exit(1);
    }

    if (!prompt) {
      console.error('Error: --prompt or --file argument is required');
      process.exit(1);
    }

    console.log('Generating multi-speaker audio...');
    console.log(`Speakers: ${speakers.map((s) => s.name).join(', ')}`);
    console.log(`Output: ${outputPath}`);

    await generateMultiSpeakerAudio({
      speakers,
      prompt,
      outputPath,
    });

    console.log('✓ Audio generated successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
