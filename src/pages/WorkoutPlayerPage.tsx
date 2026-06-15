import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWorkouts } from '../context/WorkoutContext';
import { useExercises } from '../context/ExerciseContext';
import type { WorkoutItem, DurationSet } from '../types';

const RING_SIZE = 208;
const RING_R = 92;
const RING_STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
const REST_DEFAULT = 15;

function exTime(item: WorkoutItem): number {
  if (item.mode === 'duration') {
    const t = item.sets.reduce((a, st) => a + (parseInt((st as DurationSet).sec) || 0), 0);
    return Math.max(t, 30);
  }
  return (item.sets.length || 1) * 40;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Phase = 'work' | 'rest';

export default function WorkoutPlayerPage() {
  const { t } = useTheme();
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { workouts } = useWorkouts();
  const { exercises, publicExercises } = useExercises();
  const allEx = [...exercises, ...publicExercises];
  const exById = (id: string) => allEx.find(e => e.id === id);

  const workout = workouts.find(w => w.id === workoutId);
  const items = workout?.items ?? [];

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [remaining, setRemaining] = useState(() => items[0] ? exTime(items[0]) : 0);
  const [totalTime, setTotalTime] = useState(() => items[0] ? exTime(items[0]) : 0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPhase = useCallback((i: number, p: Phase) => {
    const dur = p === 'rest' ? REST_DEFAULT : (items[i] ? exTime(items[i]) : 30);
    setIdx(i);
    setPhase(p);
    setRemaining(dur);
    setTotalTime(dur);
    setPaused(false);
  }, [items]);

  useEffect(() => {
    if (done || paused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (phase === 'work') {
            if (idx < items.length - 1) {
              setTimeout(() => startPhase(idx, 'rest'), 0);
            } else {
              setDone(true);
            }
          } else {
            setTimeout(() => startPhase(idx + 1, 'work'), 0);
          }
          return 0;
        }
        return prev - 1;
      });
      setTotalElapsed(e => e + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [done, paused, phase, idx, items.length, startPhase]);

  if (!workout) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg }}>
        <span style={{ color: t.ink, fontSize: 16 }}>Workout not found</span>
        <button onClick={() => navigate('/workouts')} style={{ marginTop: 20, background: 'none', color: t.accent, fontWeight: 700, cursor: 'pointer' }}>Go back</button>
      </div>
    );
  }

  const curEx = items[idx] ? exById(items[idx].exerciseId) : null;
  const nextEx = items[idx + 1] ? exById(items[idx + 1].exerciseId) : null;
  const progress = totalTime > 0 ? remaining / totalTime : 0;
  const dashOffset = CIRCUMFERENCE * progress;

  const handlePrev = () => {
    if (phase === 'rest') { startPhase(idx, 'work'); return; }
    if (idx > 0) startPhase(idx - 1, 'work');
  };

  const handleSkip = () => {
    if (phase === 'rest') { startPhase(idx + 1, 'work'); return; }
    if (idx < items.length - 1) startPhase(idx, 'rest');
    else setDone(true);
  };

  const handleRestart = () => {
    setDone(false);
    setTotalElapsed(0);
    startPhase(0, 'work');
  };

  const handleClose = () => navigate('/workouts');

  const addRest = () => {
    setRemaining(r => r + 15);
    setTotalTime(tt => tt + 15);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg,
  };

  if (done) {
    const totalMin = Math.max(1, Math.round(totalElapsed / 60));
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 45, background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <span style={{ fontSize: 40, color: t.accent }}>✓</span>
          </div>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 28, color: t.ink }}>Workout complete</h1>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: t.sub, textAlign: 'center', marginTop: 8 }}>
            {workout.name} · {items.length} exercises · {totalMin} min
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
            <button onClick={handleRestart} style={{
              border: `1.5px solid ${t.line}`, borderRadius: 14, padding: '14px 28px',
              background: 'none', color: t.ink, fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>Restart</button>
            <button onClick={handleClose} style={{
              borderRadius: 14, padding: '14px 28px', background: t.accent,
              color: t.onAccent, fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px' }}>
        <button onClick={handleClose} style={{
          width: 40, height: 40, borderRadius: 13, border: `1.5px solid ${t.line}`,
          background: t.surface, color: t.ink, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>✕</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 15, color: t.ink }}>{workout.name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>
            {phase === 'rest' ? 'Rest' : `Exercise ${idx + 1} of ${items.length}`}
          </div>
        </div>
        <button onClick={handleRestart} style={{
          width: 40, height: 40, borderRadius: 13, border: `1.5px solid ${t.line}`,
          background: t.surface, color: t.ink, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>↺</button>
      </div>

      {/* Progress segments */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 8 }}>
        {items.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? t.accent : t.line }} />
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 30px' }}>
        {phase === 'rest' ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 16 }}>REST</div>
            <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.line} strokeWidth={RING_STROKE} fill="none" />
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.accent} strokeWidth={RING_STROKE} fill="none"
                  strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 52, color: t.ink }}>{fmt(remaining)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.sub }}>until next</span>
              </div>
            </div>
            <button onClick={addRest} style={{
              border: `1.5px solid ${t.line}`, borderRadius: 999, padding: '10px 20px',
              marginTop: 16, color: t.ink, fontWeight: 800, fontSize: 14, background: 'none', cursor: 'pointer',
            }}>+15 sec</button>
            {nextEx && (
              <div style={{
                borderRadius: 18, padding: 14, width: '100%', maxWidth: 360, marginTop: 20,
                background: t.card, boxShadow: 'var(--shadow)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: t.sub, letterSpacing: 0.5 }}>
                  NEXT UP · {idx + 2} OF {items.length}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <div className="monogram" style={{ width: 38, height: 38, borderRadius: 12, fontSize: 15 }}>{nextEx.title[0]}</div>
                  <span style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 15.5, color: t.ink, flex: 1 }}>{nextEx.title}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{
              width: 120, height: 120, borderRadius: 20, border: `1.5px dashed ${t.line}`, background: t.chip,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="monogram" style={{ width: 64, height: 64, borderRadius: 20, fontSize: 28 }}>{curEx?.title?.[0] ?? '?'}</div>
            </div>
            <h2 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 26, textAlign: 'center', marginTop: 14, color: t.ink }}>
              {curEx?.title ?? 'Unknown'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {items[idx]?.sets.map((st, si) => (
                <div key={si} style={{ padding: '6px 12px', borderRadius: 999, background: t.chip }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: t.sub }}>
                    {items[idx].mode === 'duration' ? `${(st as DurationSet).sec || '30'} sec` : `${(st as any).reps || '?'} reps${(st as any).kg ? ` · ${(st as any).kg}kg` : ''}`}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, marginTop: 24 }}>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.line} strokeWidth={RING_STROKE} fill="none" />
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.accent} strokeWidth={RING_STROKE} fill="none"
                  strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 52, color: t.ink }}>{fmt(remaining)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.sub }}>remaining</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '12px 0' }}>
        <button onClick={handlePrev} disabled={phase === 'work' && idx === 0} style={{
          width: 52, height: 52, borderRadius: 26, border: `1.5px solid ${t.line}`,
          background: 'none', color: t.ink, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: phase === 'work' && idx === 0 ? 0.4 : 1,
        }}>⏮</button>
        <button onClick={() => setPaused(p => !p)} style={{
          width: 74, height: 74, borderRadius: 37, background: t.accent,
          color: t.onAccent, fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{paused ? '▶' : '⏸'}</button>
        <button onClick={handleSkip} style={{
          width: 52, height: 52, borderRadius: 26, border: `1.5px solid ${t.line}`,
          background: 'none', color: t.ink, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>⏭</button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 20 }}>
        {phase === 'rest' ? 'Skip rest to start now' : nextEx ? `Up next · ${nextEx.title}` : 'Final exercise'}
      </p>
    </div>
  );
}
