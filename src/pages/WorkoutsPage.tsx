import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWorkouts } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import type { WorkoutItem, WorkoutPlan, DurationSet } from '../types';

function exTime(item: WorkoutItem): number {
  if (item.mode === 'duration') {
    const t = item.sets.reduce((a, st) => a + (parseInt((st as DurationSet).sec) || 0), 0);
    return t || 30;
  }
  return (item.sets.length || 1) * 40;
}

export default function WorkoutsPage() {
  const { t } = useTheme();
  const { searchWorkouts, deleteWorkout } = useWorkouts();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    const result = await searchWorkouts({}, { page: pageNum });
    setWorkouts(prev => append ? [...prev, ...result.data] : result.data);
    setTotalCount(result.totalCount);
    setHasMore(result.hasMore);
    setLoading(false);
  }, [searchWorkouts]);

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage, true);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  const handleDelete = async (e: React.MouseEvent, w: WorkoutPlan) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${w.name}"? This action cannot be undone.`)) return;
    await deleteWorkout(w.id);
    setWorkouts(prev => prev.filter(wk => wk.id !== w.id));
    setTotalCount(prev => prev - 1);
  };

  return (
    <div className="page">
      <div className="page-eyebrow">// Deploy</div>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <button className="btn-accent" onClick={() => navigate('/workouts/new')}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M11 5v12M5 11h12" /></svg>
        </button>
      </div>
      <div className="page-count">{totalCount} {totalCount === 1 ? 'session' : 'sessions'}</div>

      <div className="card-grid" style={{ marginTop: 18 }}>
        {workouts.map((w, wi) => {
          const totalSecs = w.items.reduce((a, it) => a + exTime(it), 0);
          const mins = Math.max(1, Math.round(totalSecs / 60));
          const isOwn = w.userId === user?.id;
          const isPublicFromOther = w.isPublic && !isOwn;
          return (
            <div key={w.id} style={{
              background: t.surface, border: `1px solid ${t.line}`, borderRadius: 3,
              padding: 18, marginBottom: 12, cursor: 'pointer', position: 'relative',
            }} onClick={() => navigate(`/workouts/play/${w.id}`)}>
              {isOwn && (
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 1 }}>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/workouts/edit/${w.id}`); }} style={{
                    width: 26, height: 26, borderRadius: 3, border: `1px solid ${t.line}`,
                    background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2l3 3-7 7H0V9z" /></svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, w)} style={{
                    width: 26, height: 26, borderRadius: 3, border: `1px solid ${t.line}`,
                    background: 'transparent', color: t.danger, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 3h10M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M9.5 3l-.5 7a1 1 0 01-1 1H4a1 1 0 01-1-1L2.5 3" /></svg>
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, color: t.accent, width: 36 }}>{wi + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, lineHeight: 1, letterSpacing: '.02em', textTransform: 'uppercase', color: t.ink }}>{w.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub }}>
                      {w.items.length} {w.items.length === 1 ? 'drill' : 'drills'} · ~{mins} min
                    </span>
                    {isPublicFromOther && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                        color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 2,
                        padding: '3px 6px', flexShrink: 0, lineHeight: 1,
                      }}>PUBLIC</span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 46, height: 46, borderRadius: 3, background: t.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="5,3 15,9 5,15" /></svg>
                </div>
              </div>
            </div>
          );
        })}

        {loading && workouts.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: t.sub }}>Loading...</div>
          </div>
        )}

        {!loading && workouts.length === 0 && (
          <div style={{
            border: `1px dashed ${t.line}`, borderRadius: 3, padding: 40, textAlign: 'center',
            gridColumn: '1 / -1',
          }}>
            <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, textTransform: 'uppercase', color: t.ink }}>No sessions yet</h3>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, margin: '10px 0 18px' }}>
              Build a session and launch it here
            </p>
            <button className="btn-primary" onClick={() => navigate('/workouts/new')}>Build a session</button>
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && workouts.length > 0 && (
          <div style={{ padding: 20, textAlign: 'center', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub }}>Loading more...</span>
          </div>
        )}
      </div>
    </div>
  );
}
