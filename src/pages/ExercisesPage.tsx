import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useExercises } from '../context/ExerciseContext';
import { useAuth } from '../context/AuthContext';
import type { Exercise } from '../types';

const SORT_OPTIONS = [
  { key: 'az', label: 'A–Z' },
  { key: 'recent', label: 'Recent' },
  { key: 'difficulty', label: 'Level' },
] as const;

const DIFF_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function ExercisesPage({ toast }: { toast?: { show: (m: string) => void } }) {
  const { t } = useTheme();
  const { exercises, publicExercises, allTags, deleteExercise } = useExercises();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<string>('az');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allExercises = useMemo(() => [...exercises, ...publicExercises], [exercises, publicExercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allExercises.filter(ex => {
      const matchSearch = !q || ex.title.toLowerCase().includes(q) || ex.tags.some(tag => tag.toLowerCase().includes(q));
      const matchTags = selectedTags.length === 0 || selectedTags.some(tag => ex.tags.includes(tag));
      return matchSearch && matchTags;
    });
  }, [allExercises, search, selectedTags]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'recent') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      if (sort === 'difficulty') return (DIFF_ORDER[a.difficulty] ?? 0) - (DIFF_ORDER[b.difficulty] ?? 0) || a.title.localeCompare(b.title);
      return 0;
    });
  }, [filtered, sort]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  const handleDelete = async (ex: Exercise) => {
    if (!window.confirm(`Delete "${ex.title}"? This action cannot be undone.`)) return;
    await deleteExercise(ex.id);
    toast?.show('Drill deleted');
    setExpandedId(null);
  };

  return (
    <div className="page">
      <div className="page-eyebrow">// Train</div>
      <div className="page-header">
        <h1 className="page-title">Drills</h1>
        <button className="btn-accent" onClick={() => navigate('/exercises/new')}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M11 5v12M5 11h12" /></svg>
        </button>
      </div>
      <div className="page-count">{filtered.length} movements</div>

      <div className="search-box">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke={t.sub} strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M16 16l-3.6-3.6" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH DRILLS OR TAGS" />
      </div>

      <div className="chip-row">
        <button className={`chip ${selectedTags.length === 0 ? 'active' : ''}`} onClick={() => setSelectedTags([])}>All</button>
        {allTags.map(tag => (
          <button key={tag} className={`chip ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
        ))}
      </div>

      <div className="sort-row">
        <span className="sort-label">Sort</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} className={`chip ${sort === opt.key ? 'active' : ''}`} onClick={() => setSort(opt.key)}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {sorted.map((ex, idx) => (
          <DrillRow
            key={ex.id}
            exercise={ex}
            index={idx + 1}
            expanded={expandedId === ex.id}
            onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
            isOwn={ex.userId === user?.id}
            onEdit={() => navigate(`/exercises/edit/${ex.id}`)}
            onDelete={() => handleDelete(ex)}
          />
        ))}
        <div style={{ borderTop: `1px solid ${t.line}` }} />

        {sorted.length === 0 && (
          <div className="empty-state">
            <h3>No drills found</h3>
            <p>Try another search or tag</p>
            <button onClick={() => { setSearch(''); setSelectedTags([]); }} style={{
              border: `1px solid ${t.line}`, background: 'transparent', color: t.ink,
              fontWeight: 800, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '12px 20px', borderRadius: 3, cursor: 'pointer',
            }}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DrillRow({ exercise: ex, index, expanded, onToggle, isOwn, onEdit, onDelete }: {
  exercise: Exercise; index: number; expanded: boolean; onToggle: () => void;
  isOwn: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const { t } = useTheme();

  return (
    <div style={{ borderTop: `1px solid ${t.line}` }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 15, padding: '16px 22px',
        background: 'none', cursor: 'pointer', textAlign: 'left', border: 'none',
      }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 23, color: t.sub, opacity: 0.45, width: 30, flexShrink: 0 }}>{index}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 21, lineHeight: 1, letterSpacing: '.02em', textTransform: 'uppercase', color: t.ink }}>{ex.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ex.difficulty} · {ex.tags.join(', ') || 'No tags'}
            </span>
            {ex.isPublic && !isOwn && (
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 2,
                padding: '3px 6px', flexShrink: 0, lineHeight: 1,
              }}>PUBLIC</span>
            )}
          </div>
        </div>
        <span style={{ color: t.sub, transition: 'transform .2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l5 4-5 4" /></svg>
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 22px 20px' }}>
          <div style={{
            height: 150, border: `1px dashed ${t.line}`,
            background: `repeating-linear-gradient(45deg, ${t.chip} 0 11px, transparent 11px 22px)`,
            borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 18,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: t.sub }}>
              {ex.mediaType === 'video' ? 'Exercise demo video' : 'Exercise photo'}
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: t.sub, opacity: 0.7 }}>drop image / video</div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: t.accent, marginBottom: 12 }}>Execution</div>
          {ex.steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 13, marginBottom: 12 }}>
              <div style={{
                width: 24, height: 24, flexShrink: 0, border: `1px solid ${t.line}`, color: t.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Anton', sans-serif", fontSize: 13, borderRadius: 2,
              }}>{i + 1}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: t.ink, opacity: 0.9 }}>{step.description}</div>
            </div>
          ))}

          {ex.tips.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: t.accent, margin: '18px 0 10px' }}>Cues</div>
              {ex.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, background: t.accent, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: t.ink, opacity: 0.88 }}>{tip}</div>
                </div>
              ))}
            </>
          )}

          {ex.donts.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: t.danger, margin: '18px 0 10px' }}>No-Go</div>
              {ex.donts.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, background: t.danger, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: t.ink, opacity: 0.88 }}>{d}</div>
                </div>
              ))}
            </>
          )}

          {/* Edit & Delete buttons for own drills */}
          {isOwn && (
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={onEdit} style={{
                flex: 1, padding: '12px 0', borderRadius: 3, fontSize: 10, fontWeight: 800,
                letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                background: t.accent, color: t.onAccent, border: 'none',
              }}>Edit</button>
              <button onClick={onDelete} style={{
                padding: '12px 18px', borderRadius: 3, fontSize: 10, fontWeight: 800,
                letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                background: 'transparent', color: t.danger, border: `1px solid ${t.danger}`,
              }}>Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
