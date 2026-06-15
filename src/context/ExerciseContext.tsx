import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Exercise } from '../types';

interface ExerciseContextType {
  exercises: Exercise[];
  publicExercises: Exercise[];
  allTags: string[];
  loading: boolean;
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

const DEFAULT_TAGS = ['Core', 'Legs', 'Glutes', 'Upper Body', 'Arms', 'Back', 'Cardio', 'Mobility', 'Full Body', 'No Equipment'];

function mapRow(r: any): Exercise {
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

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [publicExercises, setPublicExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const allTags = (() => {
    const set = new Set(DEFAULT_TAGS);
    for (const ex of [...exercises, ...publicExercises]) {
      for (const tag of ex.tags) set.add(tag);
    }
    return Array.from(set);
  })();

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);

    const { data: ownRows, error: ownError } = await supabase
      .from('exercises')
      .select('*, exercise_steps(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ownError) {
      console.error('Failed to fetch exercises:', ownError.message);
      setLoading(false);
      return;
    }

    const { data: pubRows, error: pubError } = await supabase
      .from('exercises')
      .select('*, exercise_steps(*)')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pubError) {
      console.error('Failed to fetch public exercises:', pubError.message);
    }

    setExercises((ownRows ?? []).map(mapRow));
    setPublicExercises((pubRows ?? []).map(mapRow));
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchExercises();
    else {
      setExercises([]);
      setPublicExercises([]);
      setLoading(false);
    }
  }, [user?.id]);

  const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        title: exercise.title,
        media_url: exercise.mediaUri,
        media_type: exercise.mediaType,
        is_public: exercise.isPublic,
        user_id: user.id,
        tags: exercise.tags,
        difficulty: exercise.difficulty,
        tips: exercise.tips,
        donts: exercise.donts,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add exercise:', error?.message);
      return;
    }

    if (exercise.steps.length > 0) {
      const stepRows = exercise.steps.map((s, i) => ({
        exercise_id: data.id,
        description: s.description,
        sort_order: i,
      }));
      await supabase.from('exercise_steps').insert(stepRows);
    }

    await fetchExercises();
  };

  const updateExercise = async (exercise: Exercise) => {
    const { error } = await supabase
      .from('exercises')
      .update({
        title: exercise.title,
        media_url: exercise.mediaUri,
        media_type: exercise.mediaType,
        is_public: exercise.isPublic,
        tags: exercise.tags,
        difficulty: exercise.difficulty,
        tips: exercise.tips,
        donts: exercise.donts,
      })
      .eq('id', exercise.id);

    if (error) {
      console.error('Failed to update exercise:', error.message);
      return;
    }

    await supabase.from('exercise_steps').delete().eq('exercise_id', exercise.id);

    if (exercise.steps.length > 0) {
      const stepRows = exercise.steps.map((s, i) => ({
        exercise_id: exercise.id,
        description: s.description,
        sort_order: i,
      }));
      await supabase.from('exercise_steps').insert(stepRows);
    }

    await fetchExercises();
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete exercise:', error.message);
      return;
    }
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  return (
    <ExerciseContext.Provider
      value={{ exercises, publicExercises, allTags, loading, addExercise, updateExercise, deleteExercise, refresh: fetchExercises }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercises() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error('useExercises must be inside ExerciseProvider');
  return ctx;
}
