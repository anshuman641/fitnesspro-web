import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWorkouts } from '../context/WorkoutContext';
import { useExercises } from '../context/ExerciseContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useProfile } from '../context/ProfileContext';
import { useWorkoutAudio } from '../hooks/useWorkoutAudio';
import type { Exercise, WorkoutItem, WorkoutPlan, DurationSet } from '../types';

const RING_SIZE = 208;
const RING_R = 92;
const RING_STROKE = 10;
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
  const { fetchWorkoutById } = useWorkouts();
  const { fetchExercisesByIds } = useExercises();

  const { setActive, confirmLeave } = useActiveSession();
  const { recordWorkoutCompletion } = useProfile();
  const { playWork, playRest, stopAll } = useWorkoutAudio();

  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [exMap, setExMap] = useState<Map<string, Exercise>>(new Map());
  const [dataLoading, setDataLoading] = useState(true);

  const items = workout?.items ?? [];
  const exById = (id: string) => exMap.get(id) ?? null;

  useEffect(() => {
    if (!workoutId) return;
    (async () => {
      const w = await fetchWorkoutById(workoutId);
      if (!w) { setDataLoading(false); return; }
      setWorkout(w);
      const ids = [...new Set(w.items.map(it => it.exerciseId))];
      if (ids.length > 0) {
        const exercises = await fetchExercisesByIds(ids);
        setExMap(new Map(exercises.map(ex => [ex.id, ex])));
      }
      setDataLoading(false);
    })();
  }, [workoutId, fetchWorkoutById, fetchExercisesByIds]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [remaining, setRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!workout || initialized.current) return;
    if (workout.items.length > 0) {
      const dur = exTime(workout.items[0]);
      setRemaining(dur);
      setTotalTime(dur);
      initialized.current = true;
    }
  }, [workout]);

  useEffect(() => {
    setActive(true);
    return () => { setActive(false); stopAll(); };
  }, [setActive, stopAll]);

  useEffect(() => {
    if (done || paused) return;
    if (phase === 'work') playWork();
    else playRest();
  }, [phase, done, paused, playWork, playRest]);

  useEffect(() => {
    if (paused) stopAll();
  }, [paused, stopAll]);

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

  const completionRecorded = useRef(false);
  useEffect(() => {
    if (done && !completionRecorded.current) {
      completionRecorded.current = true;
      stopAll();
      setActive(false);
      recordWorkoutCompletion(totalElapsed);
    }
  }, [done, totalElapsed, stopAll, setActive, recordWorkoutCompletion]);

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.sub }}>Loading session...</span>
      </div>
    );
  }

  if (!workout) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: t.bg }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.ink }}>Session not found</span>
        <button onClick={() => navigate('/workouts')} style={{ marginTop: 20, background: 'none', color: t.accent, fontWeight: 800, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Go back</button>
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

  const handleClose = () => {
    confirmLeave(() => {
      stopAll();
      navigate('/workouts');
    });
  };

  const addRest = () => {
    setRemaining(r => r + 15);
    setTotalTime(tt => tt + 15);
  };

  if (done) {
    const totalMin = Math.max(1, Math.round(totalElapsed / 60));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 3, background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={t.accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20l7 7 13-17" /></svg>
          </div>
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 42, textTransform: 'uppercase', color: t.ink }}>Complete</h1>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.sub, textAlign: 'center', marginTop: 10 }}>
            {items.length} drills · {totalMin} min
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
            <button onClick={handleRestart} style={{
              border: `1px solid ${t.line}`, borderRadius: 3, padding: '14px 28px',
              background: 'none', color: t.ink, fontWeight: 800, fontSize: 11,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
            }}>Run again</button>
            <button onClick={handleClose} style={{
              borderRadius: 3, padding: '14px 28px', background: t.accent,
              color: '#fff', fontWeight: 800, fontSize: 11,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', border: 'none',
            }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  const hasMedia = curEx?.mediaUri;
  const isVideo = curEx?.mediaType === 'video';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg, position: 'relative', overflow: 'hidden' }}>
      {/* Media backdrop */}
      {hasMedia && (
        <>
          {isVideo ? (
            <video
              key={curEx!.id}
              src={curEx!.mediaUri!}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', zIndex: 0,
              }}
            />
          ) : (
            <img
              key={curEx!.id}
              src={curEx!.mediaUri!}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', zIndex: 0,
              }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(2px)',
          }} />
        </>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <button onClick={handleClose} style={{
          width: 40, height: 40, borderRadius: 3, border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.25)' : t.line}`,
          background: 'transparent', color: hasMedia ? '#fff' : t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: hasMedia ? '#fff' : t.ink }}>{workout.name}</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.accent }}>
            Drill {idx + 1} / {items.length}
          </div>
        </div>
        <button onClick={handleRestart} style={{
          width: 40, height: 40, borderRadius: 3, border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.25)' : t.line}`,
          background: 'transparent', color: hasMedia ? '#fff' : t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8a6 6 0 1 1 1.8 4.3" /><path d="M2 13V8h5" /></svg>
        </button>
      </div>

      {/* Progress segments */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 8, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        {items.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 1, background: i <= idx ? t.accent : t.line }} />
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 30px', position: 'relative', zIndex: 2 }}>
        {phase === 'rest' ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: t.accent, marginBottom: 16 }}>REST</div>
            <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={hasMedia ? 'rgba(255,255,255,0.2)' : t.line} strokeWidth={RING_STROKE} fill="none" />
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.accent} strokeWidth={RING_STROKE} fill="none"
                  strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 56, color: hasMedia ? '#fff' : t.ink }}>{fmt(remaining)}</span>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: hasMedia ? 'rgba(255,255,255,0.6)' : t.sub }}>until next</span>
              </div>
            </div>
            <button onClick={addRest} style={{
              border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.25)' : t.line}`, borderRadius: 3, padding: '10px 20px',
              marginTop: 16, color: hasMedia ? '#fff' : t.ink, fontWeight: 800, fontSize: 11,
              letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', cursor: 'pointer',
            }}>+15 sec</button>
            {nextEx && (
              <div style={{
                borderRadius: 3, padding: 14, width: '100%', maxWidth: 360, marginTop: 20,
                background: hasMedia ? 'rgba(255,255,255,0.1)' : t.card, border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.15)' : t.line}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: hasMedia ? 'rgba(255,255,255,0.6)' : t.sub }}>
                  Next up · {idx + 2} of {items.length}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <div className="monogram monogram-sm">{nextEx.title[0]}</div>
                  <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: hasMedia ? '#fff' : t.ink, flex: 1 }}>{nextEx.title}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {!hasMedia && (
              <div style={{
                width: 120, height: 120, borderRadius: 3, border: `1px dashed ${t.line}`,
                background: `repeating-linear-gradient(45deg, ${t.chip} 0 11px, transparent 11px 22px)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="monogram" style={{ width: 64, height: 64, fontSize: 28 }}>{curEx?.title?.[0] ?? '?'}</div>
              </div>
            )}
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, textAlign: 'center', marginTop: 14, textTransform: 'uppercase', color: hasMedia ? '#fff' : t.ink }}>
              {curEx?.title ?? 'Unknown'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {items[idx]?.sets.map((st, si) => (
                <div key={si} style={{ padding: '6px 12px', borderRadius: 2, background: hasMedia ? 'rgba(255,255,255,0.15)' : t.chip }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: hasMedia ? 'rgba(255,255,255,0.8)' : t.sub }}>
                    {items[idx].mode === 'duration' ? `${(st as DurationSet).sec || '30'} sec` : `${(st as any).reps || '?'} reps${(st as any).kg ? ` · ${(st as any).kg}kg` : ''}`}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, marginTop: 24 }}>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={hasMedia ? 'rgba(255,255,255,0.2)' : t.line} strokeWidth={RING_STROKE} fill="none" />
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={t.accent} strokeWidth={RING_STROKE} fill="none"
                  strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 56, color: hasMedia ? '#fff' : t.ink }}>{fmt(remaining)}</span>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: hasMedia ? 'rgba(255,255,255,0.6)' : t.sub }}>remaining</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transport controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '12px 0', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <button onClick={handlePrev} disabled={phase === 'work' && idx === 0} style={{
          width: 54, height: 54, borderRadius: 3, border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.25)' : t.line}`,
          background: 'none', color: hasMedia ? '#fff' : t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: phase === 'work' && idx === 0 ? 0.4 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="3" height="12" /><polygon points="16,3 7,9 16,15" /></svg>
        </button>
        <button onClick={() => setPaused(p => !p)} style={{
          width: 78, height: 78, borderRadius: 3, background: t.accent,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none',
        }}>
          {paused ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 21,12 6,21" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" /><rect x="14" y="3" width="5" height="18" /></svg>
          )}
        </button>
        <button onClick={handleSkip} style={{
          width: 54, height: 54, borderRadius: 3, border: `1px solid ${hasMedia ? 'rgba(255,255,255,0.25)' : t.line}`,
          background: 'none', color: hasMedia ? '#fff' : t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="2,3 11,9 2,15" /><rect x="13" y="3" width="3" height="12" /></svg>
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: hasMedia ? 'rgba(255,255,255,0.6)' : t.sub, marginBottom: 20, position: 'relative', zIndex: 2 }}>
        {phase === 'rest' ? 'Skip rest to start now' : nextEx ? `Next · ${nextEx.title}` : 'Final drill'}
      </p>
    </div>
  );
}
