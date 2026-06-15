export interface ExerciseStep {
  id: string;
  description: string;
}

export type MediaType = 'image' | 'video';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  title: string;
  steps: ExerciseStep[];
  mediaUri: string | null;
  mediaType: MediaType | null;
  tags: string[];
  difficulty: Difficulty;
  tips: string[];
  donts: string[];
  isPublic: boolean;
  userId?: string;
  createdAt?: string;
}

export type WorkoutMode = 'reps' | 'duration';

export interface RepsSet {
  kg: string;
  reps: string;
}

export interface DurationSet {
  sec: string;
}

export interface WorkoutItem {
  exerciseId: string;
  mode: WorkoutMode;
  sets: (RepsSet | DurationSet)[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  items: WorkoutItem[];
  isPublic: boolean;
  userId?: string;
}
