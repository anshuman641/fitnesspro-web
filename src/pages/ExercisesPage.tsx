import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useExercises } from '../context/ExerciseContext';
import type { Exercise } from '../types';

const SORT_OPTIONS = [
  { key: 'az', label: 'A–Z' },
  { key: 'recent', label: 'Recent' },
  { key: 'difficulty', label: 'Level' },
] as const;

const DIFF_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function ExercisesPage() {
  const { t } = useTheme();
  const { exercises, publicExercises, allTags } = useExercises();
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Exercises</h1>
        <button className="btn-icon" onClick={() => navigate('/exercises/new')}>+</button>
      </div>
      <div className="page-count">{filtered.length} {filtered.length === 1 ? 'exercise' : 'exercises'}</div>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises or tags" />
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

      {sorted.map(ex => (
        <ExerciseCard key={ex.id} exercise={ex} expanded={expandedId === ex.id} onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)} />
      ))}

      {sorted.length === 0 && (
        <div className="empty-state">
          <h3>No exercises found</h3>
          <p>Try a different search or tag.</p>
          <button className="btn-primary" onClick={() => { setSearch(''); setSelectedTags([]); }}>Clear filters</button>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ exercise: ex, expanded, onToggle }: { exercise: Exercise; expanded: boolean; onToggle: () => void }) {
  const { t } = useTheme();

  return (
    <div className="card">
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 13, padding: 14, width: '100%',
        background: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div className="monogram">{ex.title[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 17, color: t.ink }}>{ex.title}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ex.difficulty} · {ex.tags.join(', ') || 'No tags'}
          </div>
        </div>
        <span style={{ color: t.sub, fontSize: 14, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 16px' }}>
          <div style={{
            height: 148, borderRadius: 16, border: `1.5px dashed ${t.line}`, background: t.chip,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14,
          }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: t.sub }}>{ex.mediaType === 'video' ? 'Exercise demo video' : 'Exercise photo'}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: t.sub, opacity: 0.7 }}>drop image / video</span>
          </div>

          <div className="section-label">Steps</div>
          {ex.steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 11, marginBottom: 9 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 8, background: t.accentSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Fredoka', fontWeight: 600, fontSize: 12, color: t.accent, flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: t.ink }}>{step.description}</span>
            </div>
          ))}

          {ex.tips.length > 0 && (
            <>
              <div className="section-label" style={{ color: t.accent, marginTop: 14 }}>Tips</div>
              {ex.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: 99, background: t.accent, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: '20px', color: t.ink }}>{tip}</span>
                </div>
              ))}
            </>
          )}

          {ex.donts.length > 0 && (
            <>
              <div className="section-label" style={{ color: t.danger, marginTop: 14 }}>Avoid</div>
              {ex.donts.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: 99, background: t.danger, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: '20px', color: t.ink }}>{d}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
