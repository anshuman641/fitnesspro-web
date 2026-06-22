import { supabase } from './supabase';
import type { Exercise, WorkoutPlan, WorkoutItem, WorkoutMode, RepsSet, DurationSet } from '../types';

const PAGE_SIZE = 20;

const DEFAULT_TAGS = ['Core', 'Legs', 'Glutes', 'Upper Body', 'Arms', 'Back', 'Cardio', 'Mobility', 'Full Body', 'No Equipment'];

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize?: number;
}

export interface ExerciseFilters {
  search?: string;
  tags?: string[];
  sort?: 'az' | 'recent' | 'difficulty';
}

export interface WorkoutFilters {
  search?: string;
}

export function mapExerciseRow(r: any): Exercise {
  return {
    id: r.id,
    title: r.title,
    mediaUri: r.media_url,
    mediaType: r.media_type,
    isPublic: r.is_public ?? false,
    userId: r.user_id,
    createdAt: r.created_at,
    tags: Array.isArray(r.tags) ? r.tags : [],
    difficulty: r.difficulty || 'Beginner',
    tips: Array.isArray(r.tips) ? r.tips : [],
    donts: Array.isArray(r.donts) ? r.donts : [],
    steps: (r.exercise_steps ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((s: any) => ({ id: s.id, description: s.description })),
  };
}

export function mapWorkoutRow(r: any): WorkoutPlan {
  const items: WorkoutItem[] = (r.workout_items ?? [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((wi: any) => {
      const mode: WorkoutMode = wi.mode === 'duration' || wi.mode === 'time' ? 'duration' : 'reps';
      let sets: (RepsSet | DurationSet)[];
      if (Array.isArray(wi.set_details) && wi.set_details.length > 0) {
        sets = wi.set_details;
      } else if (mode === 'duration') {
        sets = [{ sec: String(wi.duration || 30) }];
      } else {
        sets = Array.from({ length: wi.sets || 1 }, () => ({ kg: '0', reps: '12' }));
      }
      return { exerciseId: wi.exercise_id, mode, sets };
    });
  return {
    id: r.id,
    name: r.name,
    items,
    isPublic: r.is_public ?? false,
    userId: r.user_id,
    restBetween: r.rest_between ?? 15,
  };
}

export async function fetchExercisesPage(
  userId: string,
  filters: ExerciseFilters,
  pagination: PaginationParams,
): Promise<PaginatedResult<Exercise>> {
  const size = pagination.pageSize ?? PAGE_SIZE;
  const from = pagination.page * size;
  const to = from + size - 1;

  let query = supabase
    .from('exercises')
    .select('id, title, tags, difficulty, is_public, user_id, created_at, media_url, media_type, tips, donts', { count: 'exact' })
    .or(`user_id.eq.${userId},is_public.eq.true`);

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  switch (filters.sort) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'difficulty':
      query = query.order('difficulty', { ascending: true }).order('title', { ascending: true });
      break;
    case 'az':
    default:
      query = query.order('title', { ascending: true });
      break;
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Failed to fetch exercises page:', error.message);
    return { data: [], totalCount: 0, hasMore: false };
  }

  const rows = (data ?? []).map((r: any) => mapExerciseRow({ ...r, exercise_steps: [] }));
  const total = count ?? 0;

  return {
    data: rows,
    totalCount: total,
    hasMore: to + 1 < total,
  };
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_steps(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapExerciseRow(data);
}

export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_steps(*)')
    .in('id', ids);

  if (error || !data) return [];
  return data.map(mapExerciseRow);
}

export async function fetchWorkoutsPage(
  userId: string,
  filters: WorkoutFilters,
  pagination: PaginationParams,
): Promise<PaginatedResult<WorkoutPlan>> {
  const size = pagination.pageSize ?? PAGE_SIZE;
  const from = pagination.page * size;
  const to = from + size - 1;

  let query = supabase
    .from('workouts')
    .select('*, workout_items(exercise_id, mode, set_details, duration, sets, sort_order)', { count: 'exact' })
    .or(`user_id.eq.${userId},is_public.eq.true`)
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Failed to fetch workouts page:', error.message);
    return { data: [], totalCount: 0, hasMore: false };
  }

  const rows = (data ?? []).map(mapWorkoutRow);
  const total = count ?? 0;

  return {
    data: rows,
    totalCount: total,
    hasMore: to + 1 < total,
  };
}

export async function fetchWorkoutById(id: string): Promise<WorkoutPlan | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_items(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapWorkoutRow(data);
}

export async function fetchTags(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_distinct_tags', { uid: userId });
    if (!error && Array.isArray(data)) {
      const set = new Set([...DEFAULT_TAGS, ...data]);
      return Array.from(set);
    }
  } catch {
    // RPC not available, fall back
  }

  // Fallback: lightweight query of just tags column with a limit
  const { data: rows } = await supabase
    .from('exercises')
    .select('tags')
    .or(`user_id.eq.${userId},is_public.eq.true`)
    .limit(500);

  const set = new Set(DEFAULT_TAGS);
  if (rows) {
    for (const r of rows) {
      if (Array.isArray(r.tags)) {
        for (const tag of r.tags) set.add(tag);
      }
    }
  }
  return Array.from(set);
}
