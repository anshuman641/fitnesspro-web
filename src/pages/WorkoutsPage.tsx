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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '54px 22px 0' }}>
        <div className="page-eyebrow">// Deploy</div>
        <div className="page-header">
          <h1 className="page-title">Sessions</h1>
          <button className="btn-accent" onClick={() => navigate('/workouts/new')}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M11 5v12M5 11h12" /></svg>
          </button>
        </div>
        <div className="page-count">{workouts.length} {workouts.length === 1 ? 'session' : 'sessions'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 26px', scrollbarWidth: 'none' }}>
        {workouts.map((w, wi) => {
          const totalSecs = w.items.reduce((a, it) => a + exTime(it), 0);
          const mins = Math.max(1, Math.round(totalSecs / 60));
          return (
            <div key={w.id} style={{
              background: t.surface, border: `1px solid ${t.line}`, borderRadius: 3,
              padding: 18, marginBottom: 12, cursor: 'pointer',
            }} onClick={() => navigate(`/workouts/play/${w.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, color: t.accent, width: 36 }}>{wi + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, lineHeight: 1, letterSpacing: '.02em', textTransform: 'uppercase', color: t.ink }}>{w.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub, marginTop: 6 }}>
                    {w.items.length} {w.items.length === 1 ? 'drill' : 'drills'} · ~{mins} min
                  </div>
                </div>
                <div style={{
                  width: 46, height: 46, borderRadius: 3, background: t.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="5,3 15,9 5,15" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
                {w.items.slice(0, 5).map((it, i) => {
                  const ex = exById(it.exerciseId);
                  return (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: 2, border: `1px solid ${t.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Anton', sans-serif", fontSize: 14, color: t.sub,
                    }}>{(ex?.title || '?')[0]}</div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {workouts.length === 0 && (
          <div style={{
            border: `1px dashed ${t.line}`, borderRadius: 3, padding: 40, textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, textTransform: 'uppercase', color: t.ink }}>No sessions yet</h3>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, margin: '10px 0 18px' }}>
              Build a session and launch it here
            </p>
            <button className="btn-primary" onClick={() => navigate('/workouts/new')}>Build a session</button>
          </div>
        )}
      </div>
    </div>
  );
}
