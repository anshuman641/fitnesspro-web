import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { WorkoutPlan, WorkoutItem, WorkoutMode, RepsSet, DurationSet } from '../types';

interface WorkoutContextType {
  workouts: WorkoutPlan[];
  publicWorkouts: WorkoutPlan[];
  loading: boolean;
  saveWorkout: (workout: Omit<WorkoutPlan, 'id'>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function mapRow(r: any): WorkoutPlan {
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
  };
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [publicWorkouts, setPublicWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = async () => {
    if (!user) return;
    setLoading(true);

    const { data: ownRows, error: ownError } = await supabase
      .from('workouts')
      .select('*, workout_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ownError) {
      console.error('Failed to fetch workouts:', ownError.message);
      setLoading(false);
      return;
    }

    const { data: pubRows, error: pubError } = await supabase
      .from('workouts')
      .select('*, workout_items(*)')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pubError) {
      console.error('Failed to fetch public workouts:', pubError.message);
    }

    setWorkouts((ownRows ?? []).map(mapRow));
    setPublicWorkouts((pubRows ?? []).map(mapRow));
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchWorkouts();
    else {
      setWorkouts([]);
      setPublicWorkouts([]);
      setLoading(false);
    }
  }, [user?.id]);

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

    await fetchWorkouts();
  };

  const deleteWorkout = async (id: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete workout:', error.message);
      return;
    }
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <WorkoutContext.Provider
      value={{ workouts, publicWorkouts, loading, saveWorkout, deleteWorkout, refresh: fetchWorkouts }}
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
