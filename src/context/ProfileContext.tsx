import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

/* ── Types ── */

export interface ProfileData {
  displayName: string;
  bio: string;
  avatarUri: string | null;
  goals: string[];
}

export interface Stats {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  exercisesCreated: number;
  workoutsShared: number;
}

export interface Measurement {
  key: string;
  label: string;
  value: string;
  unit: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: 'workout' | 'milestone' | 'streak' | 'social';
  icon: string;
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt: string | null;
}

export type MeasurementUnit = 'metric' | 'imperial';

export interface LevelDef {
  name: string;
  minXp: number;
  color: string;
}

/* ── Constants ── */

export const LEVELS: LevelDef[] = [
  { name: 'Rookie', minXp: 0, color: '#8A8F98' },
  { name: 'Contender', minXp: 500, color: '#2E6BFF' },
  { name: 'Warrior', minXp: 1500, color: '#FF8A2E' },
  { name: 'Elite', minXp: 4000, color: '#9B59FF' },
  { name: 'Legend', minXp: 10000, color: '#FFD700' },
];

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Workout (5)
  { id: 'first-rep', title: 'First Rep', description: 'Complete your first workout', category: 'workout', icon: '\u{1F4AA}' },
  { id: 'warming-up', title: 'Warming Up', description: 'Complete 5 workouts', category: 'workout', icon: '\u{1F525}' },
  { id: 'machine', title: 'Machine', description: 'Complete 20 workouts', category: 'workout', icon: '\u{2699}\u{FE0F}' },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Complete 50 workouts', category: 'workout', icon: '\u{1F680}' },
  { id: 'sixty-minutes', title: '60 Minutes', description: 'Log 60 total minutes', category: 'workout', icon: '\u{23F1}\u{FE0F}' },
  // Milestone (6)
  { id: 'centurion', title: 'Centurion', description: 'Complete 100 workouts', category: 'milestone', icon: '\u{1F3C6}' },
  { id: 'architect', title: 'Architect', description: 'Create your first drill', category: 'milestone', icon: '\u{1F4D0}' },
  { id: 'drill-sergeant', title: 'Drill Sergeant', description: 'Create 10 drills', category: 'milestone', icon: '\u{1F3AF}' },
  { id: 'ten-hour-club', title: 'Ten Hour Club', description: 'Log 600 total minutes', category: 'milestone', icon: '\u{1F551}' },
  { id: 'self-aware', title: 'Self Aware', description: 'Log any measurement', category: 'milestone', icon: '\u{1F4CF}' },
  { id: 'identity', title: 'Identity', description: 'Set name, bio, and avatar', category: 'milestone', icon: '\u{1F464}' },
  // Streak (3)
  { id: 'on-fire', title: 'On Fire', description: '3-day workout streak', category: 'streak', icon: '\u{1F321}\u{FE0F}' },
  { id: 'week-warrior', title: 'Week Warrior', description: '7-day workout streak', category: 'streak', icon: '\u{1F4C5}' },
  { id: 'iron-will', title: 'Iron Will', description: '30-day workout streak', category: 'streak', icon: '\u{26D3}\u{FE0F}' },
  // Social (1)
  { id: 'squad-up', title: 'Squad Up', description: 'Share a workout publicly', category: 'social', icon: '\u{1F91D}' },
];

const METRIC_MEASUREMENTS: Omit<Measurement, 'value'>[] = [
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'body-fat', label: 'Body Fat', unit: '%' },
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'shoulders', label: 'Shoulders', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
  { key: 'biceps', label: 'Biceps', unit: 'cm' },
  { key: 'thighs', label: 'Thighs', unit: 'cm' },
  { key: 'calves', label: 'Calves', unit: 'cm' },
  { key: 'neck', label: 'Neck', unit: 'cm' },
];

const IMPERIAL_MEASUREMENTS: Omit<Measurement, 'value'>[] = [
  { key: 'height', label: 'Height', unit: 'ft' },
  { key: 'weight', label: 'Weight', unit: 'lb' },
  { key: 'body-fat', label: 'Body Fat', unit: '%' },
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'shoulders', label: 'Shoulders', unit: 'in' },
  { key: 'waist', label: 'Waist', unit: 'in' },
  { key: 'hips', label: 'Hips', unit: 'in' },
  { key: 'biceps', label: 'Biceps', unit: 'in' },
  { key: 'thighs', label: 'Thighs', unit: 'in' },
  { key: 'calves', label: 'Calves', unit: 'in' },
  { key: 'neck', label: 'Neck', unit: 'in' },
];

/* ── Helpers ── */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function computeLevel(xp: number): LevelDef {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

function xpForNextLevel(xp: number): number {
  for (const lv of LEVELS) {
    if (xp < lv.minXp) return lv.minXp;
  }
  return LEVELS[LEVELS.length - 1].minXp;
}

function xpProgress(xp: number): number {
  const level = computeLevel(xp);
  const levelIdx = LEVELS.indexOf(level);
  if (levelIdx === LEVELS.length - 1) return 1;
  const next = LEVELS[levelIdx + 1];
  return (xp - level.minXp) / (next.minXp - level.minXp);
}

/* ── Default state ── */

const DEFAULT_PROFILE: ProfileData = { displayName: '', bio: '', avatarUri: null, goals: [] };
const DEFAULT_STATS: Stats = {
  totalWorkouts: 0, totalMinutes: 0, currentStreak: 0, longestStreak: 0,
  lastWorkoutDate: null, exercisesCreated: 0, workoutsShared: 0,
};

function defaultAchievements(): Record<string, AchievementState> {
  const map: Record<string, AchievementState> = {};
  for (const def of ACHIEVEMENT_DEFS) {
    map[def.id] = { unlocked: false, unlockedAt: null };
  }
  return map;
}

/* ── Context ── */

interface ProfileContextType {
  profile: ProfileData;
  setProfile: (patch: Partial<ProfileData>) => void;
  stats: Stats;
  recordWorkoutCompletion: (durationSeconds: number) => void;
  incrementExercisesCreated: () => void;
  incrementWorkoutsShared: () => void;
  xp: number;
  level: LevelDef;
  xpForNextLevel: number;
  xpProgress: number;
  measurements: Measurement[];
  setMeasurement: (key: string, value: string) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (u: MeasurementUnit) => void;
  achievements: Record<string, AchievementState>;
  achievementDefs: AchievementDef[];
}

const ProfileContext = createContext<ProfileContextType | null>(null);

/* ── Storage keys ── */
const K_PROFILE = 'fp_profile';
const K_STATS = 'fp_stats';
const K_XP = 'fp_xp';
const K_MEASUREMENTS = 'fp_measurements';
const K_MEASUREMENT_UNIT = 'fp_measurement_unit';
const K_ACHIEVEMENTS = 'fp_achievements';

/* ── Provider ── */

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileData>(() => load(K_PROFILE, DEFAULT_PROFILE));
  const [stats, setStatsState] = useState<Stats>(() => load(K_STATS, DEFAULT_STATS));
  const [xpVal, setXpVal] = useState<number>(() => load(K_XP, 0));
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>(() => load(K_MEASUREMENTS, {}));
  const [measurementUnit, setMeasurementUnitState] = useState<MeasurementUnit>(() => load(K_MEASUREMENT_UNIT, 'metric'));
  const [achievements, setAchievements] = useState<Record<string, AchievementState>>(() => {
    const stored = load<Record<string, AchievementState>>(K_ACHIEVEMENTS, {});
    const merged = defaultAchievements();
    for (const id of Object.keys(merged)) {
      if (stored[id]) merged[id] = stored[id];
    }
    return merged;
  });

  // Persist helpers
  useEffect(() => { save(K_PROFILE, profile); }, [profile]);
  useEffect(() => { save(K_STATS, stats); }, [stats]);
  useEffect(() => { save(K_XP, xpVal); }, [xpVal]);
  useEffect(() => { save(K_MEASUREMENTS, measurementValues); }, [measurementValues]);
  useEffect(() => { save(K_MEASUREMENT_UNIT, measurementUnit); }, [measurementUnit]);
  useEffect(() => { save(K_ACHIEVEMENTS, achievements); }, [achievements]);

  /* unlock helper — returns XP earned from new unlocks */
  const tryUnlock = useCallback((
    id: string,
    currentAch: Record<string, AchievementState>,
  ): { ach: Record<string, AchievementState>; xpGain: number } => {
    if (currentAch[id]?.unlocked) return { ach: currentAch, xpGain: 0 };
    const next = { ...currentAch, [id]: { unlocked: true, unlockedAt: new Date().toISOString() } };
    return { ach: next, xpGain: 50 };
  }, []);

  const checkAchievements = useCallback((
    s: Stats,
    p: ProfileData,
    mVals: Record<string, string>,
    ach: Record<string, AchievementState>,
  ): { ach: Record<string, AchievementState>; totalXpGain: number } => {
    let current = { ...ach };
    let totalXpGain = 0;

    const unlock = (id: string) => {
      const r = tryUnlock(id, current);
      current = r.ach;
      totalXpGain += r.xpGain;
    };

    // Workout
    if (s.totalWorkouts >= 1) unlock('first-rep');
    if (s.totalWorkouts >= 5) unlock('warming-up');
    if (s.totalWorkouts >= 20) unlock('machine');
    if (s.totalWorkouts >= 50) unlock('unstoppable');
    if (s.totalMinutes >= 60) unlock('sixty-minutes');

    // Milestone
    if (s.totalWorkouts >= 100) unlock('centurion');
    if (s.exercisesCreated >= 1) unlock('architect');
    if (s.exercisesCreated >= 10) unlock('drill-sergeant');
    if (s.totalMinutes >= 600) unlock('ten-hour-club');
    if (Object.values(mVals).some(v => v.trim() !== '')) unlock('self-aware');
    if (p.displayName.trim() && p.bio.trim() && p.avatarUri) unlock('identity');

    // Streak
    if (s.currentStreak >= 3) unlock('on-fire');
    if (s.currentStreak >= 7) unlock('week-warrior');
    if (s.currentStreak >= 30) unlock('iron-will');

    // Social
    if (s.workoutsShared >= 1) unlock('squad-up');

    return { ach: current, totalXpGain };
  }, [tryUnlock]);

  const setProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfileState(prev => {
      const next = { ...prev, ...patch };
      // check identity achievement
      setAchievements(ach => {
        setStatsState(st => {
          setMeasurementValues(mv => {
            const r = checkAchievements(st, next, mv, ach);
            if (r.totalXpGain > 0) setXpVal(x => x + r.totalXpGain);
            setAchievements(r.ach);
            return mv;
          });
          return st;
        });
        return ach;
      });
      return next;
    });
  }, [checkAchievements]);

  const recordWorkoutCompletion = useCallback((durationSeconds: number) => {
    const minutes = Math.round(durationSeconds / 60);
    setStatsState(prev => {
      const today = todayISO();
      let newStreak = prev.currentStreak;

      if (prev.lastWorkoutDate === today) {
        // already counted today, don't increment streak
      } else if (prev.lastWorkoutDate === yesterdayISO()) {
        newStreak = prev.currentStreak + 1;
      } else {
        newStreak = 1;
      }

      const next: Stats = {
        ...prev,
        totalWorkouts: prev.totalWorkouts + 1,
        totalMinutes: prev.totalMinutes + minutes,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastWorkoutDate: today,
      };

      // XP: +50 per workout + 10 per minute
      const baseXp = 50 + minutes * 10;

      // Check achievements with new stats
      setAchievements(ach => {
        setMeasurementValues(mv => {
          setProfileState(p => {
            const r = checkAchievements(next, p, mv, ach);
            setXpVal(x => x + baseXp + r.totalXpGain);
            setAchievements(r.ach);
            return p;
          });
          return mv;
        });
        return ach;
      });

      return next;
    });
  }, [checkAchievements]);

  const incrementExercisesCreated = useCallback(() => {
    setStatsState(prev => {
      const next = { ...prev, exercisesCreated: prev.exercisesCreated + 1 };
      const baseXp = 25;

      setAchievements(ach => {
        setMeasurementValues(mv => {
          setProfileState(p => {
            const r = checkAchievements(next, p, mv, ach);
            setXpVal(x => x + baseXp + r.totalXpGain);
            setAchievements(r.ach);
            return p;
          });
          return mv;
        });
        return ach;
      });

      return next;
    });
  }, [checkAchievements]);

  const incrementWorkoutsShared = useCallback(() => {
    setStatsState(prev => {
      const next = { ...prev, workoutsShared: prev.workoutsShared + 1 };

      setAchievements(ach => {
        setMeasurementValues(mv => {
          setProfileState(p => {
            const r = checkAchievements(next, p, mv, ach);
            if (r.totalXpGain > 0) setXpVal(x => x + r.totalXpGain);
            setAchievements(r.ach);
            return p;
          });
          return mv;
        });
        return ach;
      });

      return next;
    });
  }, [checkAchievements]);

  const setMeasurement = useCallback((key: string, value: string) => {
    setMeasurementValues(prev => {
      const next = { ...prev, [key]: value };

      setAchievements(ach => {
        setStatsState(st => {
          setProfileState(p => {
            const r = checkAchievements(st, p, next, ach);
            if (r.totalXpGain > 0) setXpVal(x => x + r.totalXpGain);
            setAchievements(r.ach);
            return p;
          });
          return st;
        });
        return ach;
      });

      return next;
    });
  }, [checkAchievements]);

  const setMeasurementUnit = useCallback((u: MeasurementUnit) => {
    setMeasurementUnitState(u);
  }, []);

  // Build measurements list
  const defs = measurementUnit === 'metric' ? METRIC_MEASUREMENTS : IMPERIAL_MEASUREMENTS;
  const measurements: Measurement[] = defs.map(d => ({
    ...d,
    value: measurementValues[d.key] || '',
  }));

  const currentLevel = computeLevel(xpVal);

  return (
    <ProfileContext.Provider value={{
      profile,
      setProfile,
      stats,
      recordWorkoutCompletion,
      incrementExercisesCreated,
      incrementWorkoutsShared,
      xp: xpVal,
      level: currentLevel,
      xpForNextLevel: xpForNextLevel(xpVal),
      xpProgress: xpProgress(xpVal),
      measurements,
      setMeasurement,
      measurementUnit,
      setMeasurementUnit,
      achievements,
      achievementDefs: ACHIEVEMENT_DEFS,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider');
  return ctx;
}
