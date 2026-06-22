import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  fetchExercisesPage,
  fetchExerciseById as fetchExerciseByIdQuery,
  fetchExercisesByIds as fetchExercisesByIdsQuery,
  fetchTags,
  type PaginatedResult,
  type PaginationParams,
  type ExerciseFilters,
} from '../lib/queryHelpers';
import type { Exercise } from '../types';

interface ExerciseContextType {
  searchExercises: (filters: ExerciseFilters, pagination: PaginationParams) => Promise<PaginatedResult<Exercise>>;
  fetchExerciseById: (id: string) => Promise<Exercise | null>;
  fetchExercisesByIds: (ids: string[]) => Promise<Exercise[]>;
  allTags: string[];
  loadTags: () => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

const DEFAULT_TAGS = ['Core', 'Legs', 'Glutes', 'Upper Body', 'Arms', 'Back', 'Cardio', 'Mobility', 'Full Body', 'No Equipment'];

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);

  const searchExercises = useCallback(async (filters: ExerciseFilters, pagination: PaginationParams) => {
    if (!user) return { data: [], totalCount: 0, hasMore: false };
    return fetchExercisesPage(user.id, filters, pagination);
  }, [user]);

  const fetchExerciseById = useCallback(async (id: string) => {
    return fetchExerciseByIdQuery(id);
  }, []);

  const fetchExercisesByIds = useCallback(async (ids: string[]) => {
    return fetchExercisesByIdsQuery(ids);
  }, []);

  const loadTags = useCallback(async () => {
    if (!user) return;
    const tags = await fetchTags(user.id);
    setAllTags(tags);
  }, [user]);

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
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete exercise:', error.message);
    }
  };

  return (
    <ExerciseContext.Provider
      value={{ searchExercises, fetchExerciseById, fetchExercisesByIds, allTags, loadTags, addExercise, updateExercise, deleteExercise }}
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
