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

  const padNum = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="page">
      <div className="page-eyebrow">// Deploy</div>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <button className="btn-new-session" onClick={() => navigate('/workouts/new')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 3v12M3 9h12" /></svg>
          New Session
        </button>
      </div>
      <div className="page-count">{totalCount} {totalCount === 1 ? 'session' : 'sessions'}</div>

      <div className="card-grid" style={{ marginTop: 18 }}>
        {workouts.map((w, wi) => {
          const totalSecs = w.items.reduce((a, it) => a + exTime(it), 0);
          const mins = Math.max(1, Math.round(totalSecs / 60));
          const isOwn = w.userId === user?.id;
          return (
            <div key={w.id} className="session-card">
              <div className="session-card-body">
                <div className="session-card-number">{padNum(wi + 1)}</div>
                <div className="session-card-info">
                  <div className="session-card-name">{w.name}</div>
                  <div className="session-card-meta">
                    {w.items.length} {w.items.length === 1 ? 'drill' : 'drills'} · ~{mins} min
                  </div>
                </div>
              </div>
              <div className="session-card-divider" />
              <div className="session-card-actions">
                <button className="btn-start" onClick={() => navigate(`/workouts/play/${w.id}`)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><polygon points="4,2 12,7 4,12" /></svg>
                  Start
                </button>
                {isOwn && (
                  <>
                    <button className="btn-card-icon" onClick={() => navigate(`/workouts/edit/${w.id}`)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3.5l3 3-8 8H1.5v-3z" /></svg>
                    </button>
                    <button className="btn-card-icon" onClick={(e) => handleDelete(e, w)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 4h12M5.5 4V3a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0110.5 3v1M12.5 4l-.6 8.5a1.5 1.5 0 01-1.5 1.5H5.6a1.5 1.5 0 01-1.5-1.5L3.5 4" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {!loading && (
          <div className="session-card-placeholder" onClick={() => navigate('/workouts/new')}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: t.accent }}>
              <path d="M16 8v16M8 16h16" />
            </svg>
            <span className="session-card-placeholder-label">Build a Session</span>
          </div>
        )}

        {loading && workouts.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: t.sub }}>Loading...</div>
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
