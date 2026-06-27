import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import { useExercises } from '../context/ExerciseContext';
import { useActiveSession } from '../context/ActiveSessionContext';
import { useProfile } from '../context/ProfileContext';
import { useWorkoutAudio } from '../hooks/useWorkoutAudio';
import type { Exercise, WorkoutItem, WorkoutPlan, DurationSet } from '../types';

const RING_SIZE = 240;
const RING_R = 105;
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#110a1f' }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Loading session...</span>
      </div>
    );
  }

  if (!workout) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#110a1f' }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: '#fff' }}>Session not found</span>
        <button onClick={() => navigate('/workouts')} style={{ marginTop: 20, background: 'none', color: '#a855f7', fontWeight: 800, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', border: 'none' }}>Go back</button>
      </div>
    );
  }

  const curEx = items[idx] ? exById(items[idx].exerciseId) : null;
  const nextEx = items[idx + 1] ? exById(items[idx + 1].exerciseId) : null;
  const progress = totalTime > 0 ? remaining / totalTime : 0;
  const dashOffset = CIRCUMFERENCE * progress;
  const progressPct = totalTime > 0 ? ((totalTime - remaining) / totalTime) * 100 : 0;

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

  const ACCENT = '#a855f7';
  const ACCENT_DIM = 'rgba(168,85,247,0.25)';

  if (done) {
    const totalMin = Math.max(1, Math.round(totalElapsed / 60));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#110a1f' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 44, background: ACCENT_DIM,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20l7 7 13-17" /></svg>
          </div>
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 42, textTransform: 'uppercase', color: '#fff' }}>Complete</h1>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10 }}>
            {items.length} drills · {totalMin} min
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
            <button onClick={handleRestart} style={{
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '14px 28px',
              background: 'none', color: '#fff', fontWeight: 800, fontSize: 11,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
            }}>Run again</button>
            <button onClick={handleClose} style={{
              borderRadius: 6, padding: '14px 28px', background: ACCENT,
              color: '#fff', fontWeight: 800, fontSize: 11,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', border: 'none',
            }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  const displayEx = phase === 'rest' ? curEx : curEx;
  const backdropEx = phase === 'rest' ? nextEx : curEx;
  const hasMedia = backdropEx?.mediaUri;
  const isVideo = backdropEx?.mediaType === 'video';
  const tags = displayEx?.tags ?? [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'linear-gradient(145deg, #1a0e2e 0%, #110a1f 30%, #0d0717 100%)',
      position: 'relative', overflow: 'hidden', color: '#fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', flexShrink: 0, zIndex: 2 }}>
        <button onClick={handleClose} style={{
          width: 42, height: 42, borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 17, textTransform: 'uppercase', letterSpacing: '.06em' }}>{workout.name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Drill {idx + 1} of {items.length}
          </div>
        </div>
        <button onClick={handleRestart} style={{
          width: 42, height: 42, borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8a6 6 0 1 1 1.8 4.3" /><path d="M2 13V8h5" /></svg>
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', padding: '0 24px', marginBottom: 4, flexShrink: 0, zIndex: 2 }}>
        <div style={{ position: 'relative', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'visible' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, ${ACCENT} 0%, #c084fc 100%)`,
            width: `${((idx / items.length) * 100) + (progressPct / items.length)}%`,
            transition: 'width 0.3s ease',
          }} />
          <div style={{
            position: 'absolute',
            top: -14,
            left: `${((idx / items.length) * 100) + (progressPct / items.length)}%`,
            transform: 'translateX(-50%)',
            fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
            color: ACCENT,
          }}>Now</div>
        </div>
      </div>

      {/* Main body — two columns */}
      <div style={{ flex: 1, display: 'flex', gap: 0, padding: '8px 24px 0', minHeight: 0, zIndex: 2 }}>
        {/* Left column — Live Demo */}
        <div style={{
          flex: '0 0 46%', display: 'flex', flexDirection: 'column',
          borderRadius: 10, overflow: 'hidden', position: 'relative',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{
            position: 'absolute', top: 14, left: 14, zIndex: 3,
            padding: '6px 12px', borderRadius: 4,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.8)',
          }}>Live Demo</div>

          {hasMedia ? (
            isVideo ? (
              <video
                key={backdropEx!.id}
                src={backdropEx!.mediaUri!}
                autoPlay loop muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                key={backdropEx!.id}
                src={backdropEx!.mediaUri!}
                alt=""
                loading="eager"
                decoding="sync"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <rect x="4" y="4" width="32" height="32" rx="3" />
                <path d="M4 28l10-10 8 8 6-6 8 8" />
                <circle cx="28" cy="12" r="3" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                Drop Exercise Demo
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>or browse files</span>
            </div>
          )}

          {/* Tags at bottom of demo area */}
          {tags.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 6, zIndex: 3,
            }}>
              {tags.slice(0, 3).map((tag, i) => (
                <span key={i} style={{
                  padding: '5px 10px', borderRadius: 3,
                  border: `1px solid ${ACCENT}`, background: 'rgba(168,85,247,0.15)',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: ACCENT,
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right column — Exercise info + timer */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          {phase === 'rest' ? (
            <>
              <div style={{
                fontSize: 13, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase',
                color: ACCENT, marginBottom: 16,
              }}>Rest</div>
              <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
                <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} fill="none" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    stroke="url(#ringGrad)" strokeWidth={RING_STROKE} fill="none"
                    strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 60, color: '#fff' }}>{fmt(remaining)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>until next</span>
                </div>
              </div>
              <button onClick={addRest} style={{
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 22px',
                marginTop: 18, color: '#fff', fontWeight: 800, fontSize: 11,
                letterSpacing: '.12em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
              }}>+15 sec</button>
            </>
          ) : (
            <>
              <h2 style={{
                fontFamily: "'Anton', sans-serif", fontSize: 38, textAlign: 'center',
                textTransform: 'uppercase', color: '#fff', lineHeight: 1.1, marginBottom: 16,
              }}>
                {curEx?.title ?? 'Unknown'}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
                {items[idx]?.sets.map((st, si) => (
                  <div key={si} style={{
                    padding: '8px 18px', borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                      {items[idx].mode === 'duration' ? `${(st as DurationSet).sec || '30'} sec` : `${(st as any).reps || '?'} reps${(st as any).kg ? ` · ${(st as any).kg}kg` : ''}`}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
                <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                  <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} fill="none" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                    stroke="url(#ringGrad)" strokeWidth={RING_STROKE} fill="none"
                    strokeLinecap="round" strokeDasharray={`${CIRCUMFERENCE}`} strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 60, color: '#fff' }}>{fmt(remaining)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>remaining</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transport controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '16px 0 8px', flexShrink: 0, zIndex: 2 }}>
        <button onClick={handlePrev} disabled={phase === 'work' && idx === 0} style={{
          width: 52, height: 52, borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          opacity: phase === 'work' && idx === 0 ? 0.3 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="3" height="12" /><polygon points="16,3 7,9 16,15" /></svg>
        </button>
        <button onClick={() => setPaused(p => !p)} style={{
          width: 72, height: 72, borderRadius: 36, background: ACCENT,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: 'none',
          boxShadow: `0 0 30px ${ACCENT_DIM}`,
        }}>
          {paused ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="7,3 21,12 7,21" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          )}
        </button>
        <button onClick={handleSkip} style={{
          width: 52, height: 52, borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="2,3 11,9 2,15" /><rect x="13" y="3" width="3" height="12" /></svg>
        </button>
      </div>

      {/* Next exercise bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 24px 18px', flexShrink: 0, zIndex: 2,
        justifyContent: 'center',
      }}>
        {phase === 'rest' ? (
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Skip rest to start now
          </span>
        ) : nextEx ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 24px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Next</span>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 14, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{nextEx.title}</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Final drill
          </span>
        )}
      </div>
    </div>
  );
}
