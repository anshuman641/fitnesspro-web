#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, resolve } from 'path';
import { randomUUID } from 'crypto';
import ws from 'ws';

// Secrets are read from environment variables — never hardcode them.
//   SUPABASE_URL          Supabase project URL
//   SUPABASE_SECRET_KEY   Supabase secret/service key (bypasses RLS)
//   EXERCISE_USER_ID      user_id to attach to uploaded exercises
//   ANTHROPIC_API_KEY     read automatically by the Anthropic SDK
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const PLACEHOLDER_USER_ID = process.env.EXERCISE_USER_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !PLACEHOLDER_USER_ID) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SECRET_KEY, EXERCISE_USER_ID');
  process.exit(1);
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

const VALID_TAGS = ['Core', 'Legs', 'Glutes', 'Upper Body', 'Arms', 'Back', 'Cardio', 'Mobility', 'Full Body', 'No Equipment'];
const VALID_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic();

function parseExerciseName(filename) {
  const name = basename(filename, extname(filename));
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

async function generateExerciseDetails(exerciseName) {
  const schema = {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: { type: 'string' },
        description: 'Brief, clear step-by-step instructions to perform the exercise (3-6 steps)',
      },
      tips: {
        type: 'array',
        items: { type: 'string' },
        description: '2-3 practical tips for performing the exercise correctly',
      },
      donts: {
        type: 'array',
        items: { type: 'string' },
        description: '2-3 common mistakes or things to avoid',
      },
      difficulty: {
        type: 'string',
        enum: VALID_DIFFICULTIES,
        description: 'Exercise difficulty level',
      },
      tags: {
        type: 'array',
        items: { type: 'string', enum: VALID_TAGS },
        description: 'Relevant muscle groups and categories',
      },
    },
    required: ['steps', 'tips', 'donts', 'difficulty', 'tags'],
    additionalProperties: false,
  };

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    output_config: {
      format: {
        type: 'json_schema',
        schema,
      },
    },
    messages: [
      {
        role: 'user',
        content: `You are a certified fitness trainer. Generate exercise details for: "${exerciseName}".

Provide:
- 3-6 brief, clear steps to perform the exercise correctly
- 2-3 practical tips for best results and proper form
- 2-3 common mistakes or things to avoid (don'ts)
- Difficulty level (Beginner, Intermediate, or Advanced)
- Relevant tags from: ${VALID_TAGS.join(', ')}

Keep instructions concise and actionable. Each step should be one clear sentence.`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return JSON.parse(textBlock.text);
}

async function uploadVideo(filePath, filename) {
  const ext = extname(filename).slice(1);
  const storagePath = `${PLACEHOLDER_USER_ID}/${randomUUID()}.${ext}`;
  const fileBuffer = readFileSync(filePath);

  const { error } = await supabase.storage
    .from('exercise-media')
    .upload(storagePath, fileBuffer, {
      contentType: `video/${ext === 'mov' ? 'quicktime' : ext}`,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('exercise-media')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

async function insertExercise(title, mediaUrl, details) {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      title,
      media_url: mediaUrl,
      media_type: 'video',
      is_public: true,
      user_id: PLACEHOLDER_USER_ID,
      tags: details.tags,
      difficulty: details.difficulty,
      tips: details.tips,
      donts: details.donts,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`DB insert failed: ${error?.message}`);

  if (details.steps.length > 0) {
    const stepRows = details.steps.map((description, i) => ({
      exercise_id: data.id,
      description,
      sort_order: i,
    }));
    const { error: stepError } = await supabase
      .from('exercise_steps')
      .insert(stepRows);
    if (stepError) throw new Error(`Steps insert failed: ${stepError.message}`);
  }

  return data.id;
}

async function main() {
  const folderPath = process.argv[2];
  if (!folderPath) {
    console.error('Usage: node scripts/bulk-upload-exercises.mjs <folder-path>');
    process.exit(1);
  }

  const resolved = resolve(folderPath);
  const files = readdirSync(resolved).filter(f => {
    const ext = extname(f).toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext) && statSync(join(resolved, f)).isFile();
  });

  if (files.length === 0) {
    console.error('No video files found in:', resolved);
    process.exit(1);
  }

  console.log(`Found ${files.length} video(s) in ${resolved}\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = join(resolved, file);
    const exerciseName = parseExerciseName(file);
    console.log(`[${success + failed + 1}/${files.length}] ${exerciseName}`);

    try {
      console.log('  Generating details with Claude...');
      const details = await generateExerciseDetails(exerciseName);

      console.log('  Uploading video...');
      const mediaUrl = await uploadVideo(filePath, file);

      console.log('  Inserting into database...');
      const id = await insertExercise(exerciseName, mediaUrl, details);

      console.log(`  Done (id: ${id})\n`);
      success++;
    } catch (err) {
      console.error(`  FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\nComplete: ${success} uploaded, ${failed} failed`);
}

main();
