import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWorkouts } from '../context/WorkoutContext';
import { useExercises } from '../context/ExerciseContext';
import type { WorkoutItem, DurationSet } from '../types';

function exTime(item: WorkoutItem): number {
  if (item.mode === 'duration') {
    const t = item.sets.reduce((a, st) => a + (parseInt((st as DurationSet).sec) || 0), 0);
    return t || 30;
  }
  return (item.sets.length || 1) * 40;
}

export default function WorkoutsPage() {
  const { t } = useTheme();
  const { workouts } = useWorkouts();
  const { exercises, publicExercises } = useExercises();
  const navigate = useNavigate();
  const allEx = [...exercises, ...publicExercises];
  const exById = (id: string) => allEx.find(e => e.id === id);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Workouts</h1>
        <button className="btn-icon" onClick={() => navigate('/workouts/new')}>+</button>
      </div>
      <div className="page-count">{workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}</div>

      {workouts.map(w => {
        const totalSecs = w.items.reduce((a, it) => a + exTime(it), 0);
        const mins = Math.max(1, Math.round(totalSecs / 60));
        return (
          <div key={w.id} className="card" style={{ padding: 16, cursor: 'pointer' }}
            onClick={() => navigate(`/workouts/play/${w.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 19, color: t.ink }}>{w.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginTop: 3 }}>
                  {w.items.length} {w.items.length === 1 ? 'exercise' : 'exercises'} · ~{mins} min
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: t.accent, boxShadow: 'var(--shadow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.onAccent, fontSize: 16,
              }}>▶</div>
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
              {w.items.slice(0, 5).map((it, i) => {
                const ex = exById(it.exerciseId);
                return (
                  <div key={i} className="monogram monogram-xs">{(ex?.title || '?')[0]}</div>
                );
              })}
            </div>
          </div>
        );
      })}

      {workouts.length === 0 && (
        <div className="empty-state">
          <h3>No workouts yet</h3>
          <p>Build a workout and it'll show up here, ready to play.</p>
          <button className="btn-primary" onClick={() => navigate('/workouts/new')}>Create a workout</button>
        </div>
      )}
    </div>
  );
}
