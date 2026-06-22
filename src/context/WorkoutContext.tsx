import { createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  fetchWorkoutsPage,
  fetchWorkoutById as fetchWorkoutByIdQuery,
  type PaginatedResult,
  type PaginationParams,
  type WorkoutFilters,
} from '../lib/queryHelpers';
import type { WorkoutPlan, DurationSet } from '../types';

interface WorkoutContextType {
  searchWorkouts: (filters: WorkoutFilters, pagination: PaginationParams) => Promise<PaginatedResult<WorkoutPlan>>;
  fetchWorkoutById: (id: string) => Promise<WorkoutPlan | null>;
  saveWorkout: (workout: Omit<WorkoutPlan, 'id'>) => Promise<void>;
  updateWorkout: (workout: WorkoutPlan) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const searchWorkouts = useCallback(async (filters: WorkoutFilters, pagination: PaginationParams) => {
    if (!user) return { data: [], totalCount: 0, hasMore: false };
    return fetchWorkoutsPage(user.id, filters, pagination);
  }, [user]);

  const fetchWorkoutById = useCallback(async (id: string) => {
    return fetchWorkoutByIdQuery(id);
  }, []);

  const saveWorkout = async (workout: Omit<WorkoutPlan, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        name: workout.name,
        rest_between: workout.restBetween ?? 15,
        is_public: workout.isPublic,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to save workout:', error?.message);
      return;
    }

    if (workout.items.length > 0) {
      const itemRows = workout.items.map((item, i) => ({
        workout_id: data.id,
        exercise_id: item.exerciseId,
        mode: item.mode,
        duration: item.mode === 'duration' ? (parseInt((item.sets[0] as DurationSet)?.sec) || 30) : 0,
        sets: item.mode === 'reps' ? item.sets.length : 1,
        set_details: item.sets,
        sort_order: i,
      }));
      await supabase.from('workout_items').insert(itemRows);
    }
  };

  const updateWorkout = async (workout: WorkoutPlan) => {
    if (!user) return;
    const { error } = await supabase
      .from('workouts')
      .update({
        name: workout.name,
        rest_between: workout.restBetween ?? 15,
        is_public: workout.isPublic,
      })
      .eq('id', workout.id);

    if (error) {
      console.error('Failed to update workout:', error.message);
      return;
    }

    await supabase.from('workout_items').delete().eq('workout_id', workout.id);

    if (workout.items.length > 0) {
      const itemRows = workout.items.map((item, i) => ({
        workout_id: workout.id,
        exercise_id: item.exerciseId,
        mode: item.mode,
        duration: item.mode === 'duration' ? (parseInt((item.sets[0] as DurationSet)?.sec) || 30) : 0,
        sets: item.mode === 'reps' ? item.sets.length : 1,
        set_details: item.sets,
        sort_order: i,
      }));
      await supabase.from('workout_items').insert(itemRows);
    }
  };

  const deleteWorkout = async (id: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete workout:', error.message);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{ searchWorkouts, fetchWorkoutById, saveWorkout, updateWorkout, deleteWorkout }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkouts() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkouts must be inside WorkoutProvider');
  return ctx;
}
