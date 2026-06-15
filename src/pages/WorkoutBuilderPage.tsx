import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useExercises } from '../context/ExerciseContext';
import { useWorkouts } from '../context/WorkoutContext';
import type { WorkoutItem, WorkoutMode, RepsSet, DurationSet } from '../types';

interface BuilderItem extends WorkoutItem {
  uid: string;
}

let uidCounter = 0;
const uid = () => 'b' + (++uidCounter) + '_' + Date.now();

export default function WorkoutBuilderPage() {
  const { t } = useTheme();
  const { exercises, publicExercises, allTags } = useExercises();
  const { saveWorkout } = useWorkouts();
  const navigate = useNavigate();
  const allEx = useMemo(() => [...exercises, ...publicExercises], [exercises, publicExercises]);

  const [wkName, setWkName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [saving, setSaving] = useState(false);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEx.filter(ex => {
      const mq = !q || ex.title.toLowerCase().includes(q) || ex.tags.some(tag => tag.toLowerCase().includes(q));
      const mt = selectedTags.length === 0 || selectedTags.some(tag => ex.tags.includes(tag));
      return mq && mt;
    });
  }, [allEx, search, selectedTags]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);

  const toggleExercise = (exId: string) => {
    setItems(prev => {
      if (prev.some(i => i.exerciseId === exId)) return prev.filter(i => i.exerciseId !== exId);
      return [...prev, { uid: uid(), exerciseId: exId, mode: 'reps' as WorkoutMode, sets: [{ kg: '', reps: '' }] }];
    });
  };

  const updateItem = (itemUid: string, fn: (it: BuilderItem) => BuilderItem) =>
    setItems(prev => prev.map(it => it.uid === itemUid ? fn(it) : it));

  const setMode = (itemUid: string, mode: WorkoutMode) =>
    updateItem(itemUid, it => it.mode === mode ? it : { ...it, mode, sets: [mode === 'reps' ? { kg: '', reps: '' } : { sec: '' }] });

  const addSet = (itemUid: string) =>
    updateItem(itemUid, it => ({ ...it, sets: [...it.sets, it.mode === 'reps' ? { kg: '', reps: '' } : { sec: '' }] }));

  const removeSet = (itemUid: string, idx: number) =>
    updateItem(itemUid, it => it.sets.length > 1 ? { ...it, sets: it.sets.filter((_, i) => i !== idx) } : it);

  const setSetField = (itemUid: string, idx: number, field: string, val: string) =>
    updateItem(itemUid, it => ({ ...it, sets: it.sets.map((st, i) => i === idx ? { ...st, [field]: val } : st) }));

  const handleSave = async () => {
    if (!wkName.trim()) { alert('Name your workout'); return; }
    if (!items.length) { alert('Add an exercise first'); return; }
    setSaving(true);
    await saveWorkout({
      name: wkName.trim(),
      items: items.map(({ exerciseId, mode, sets }) => ({ exerciseId, mode, sets })),
      isPublic: false,
    });
    setSaving(false);
    navigate('/workouts');
  };

  const segStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '9px 0', borderRadius: 10, textAlign: 'center',
    background: active ? t.surface : 'transparent', fontWeight: 800, fontSize: 13,
    color: active ? t.accent : t.sub, cursor: 'pointer',
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button className="btn-back" onClick={() => navigate('/workouts')}>‹</button>
        <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 22, letterSpacing: -0.3, color: t.ink }}>New Workout</h1>
      </div>

      <input className="input" value={wkName} onChange={e => setWkName(e.target.value)} placeholder="Workout name — e.g. Morning Reset" style={{ marginTop: 12 }} />

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises to add" />
      </div>

      <div className="chip-row">
        <button className={`chip ${selectedTags.length === 0 ? 'active' : ''}`} onClick={() => setSelectedTags([])}>All</button>
        {allTags.map(tag => (
          <button key={tag} className={`chip ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
        ))}
      </div>

      <div className="section-label">Add Exercises ({candidates.length})</div>
      {candidates.map(ex => {
        const added = items.some(i => i.exerciseId === ex.id);
        return (
          <div key={ex.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div className="monogram monogram-sm">{ex.title[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 15.5, color: t.ink }}>{ex.title}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ex.difficulty} · {ex.tags.join(', ')}
              </div>
            </div>
            <button onClick={() => toggleExercise(ex.id)} style={{
              width: 40, height: 40, borderRadius: 13, background: added ? t.accent : t.accentSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: added ? t.onAccent : t.accent, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}>{added ? '✓' : '+'}</button>
          </div>
        );
      })}

      <div className="section-label" style={{ marginTop: 22 }}>Your Workout ({items.length})</div>
      {items.length === 0 && (
        <div className="empty-state" style={{ borderRadius: 18, padding: 26 }}>
          <h3 style={{ fontSize: 15.5 }}>No exercises yet</h3>
          <p style={{ marginBottom: 0, fontSize: 13 }}>Tap + on an exercise above to build your workout.</p>
        </div>
      )}

      {items.map(it => {
        const ex = allEx.find(e => e.id === it.exerciseId);
        if (!ex) return null;
        const isReps = it.mode === 'reps';
        return (
          <div key={it.uid} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <div className="monogram monogram-sm">{ex.title[0]}</div>
              <span style={{ flex: 1, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 16, color: t.ink }}>{ex.title}</span>
              <button onClick={() => toggleExercise(it.exerciseId)} style={{
                width: 30, height: 30, borderRadius: 10, background: t.chip,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.sub, fontSize: 12, cursor: 'pointer',
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 6, padding: 5, borderRadius: 13, background: t.chip, marginBottom: 12 }}>
              <button onClick={() => setMode(it.uid, 'reps')} style={segStyle(isReps)}>Reps & weight</button>
              <button onClick={() => setMode(it.uid, 'duration')} style={segStyle(!isReps)}>Duration</button>
            </div>

            <div style={{ display: 'flex', gap: 8, paddingLeft: 4, paddingBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: t.sub, width: 30 }}>Set</span>
              {isReps ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Kg</span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Reps</span>
                </>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Seconds</span>
              )}
              <div style={{ width: 30 }} />
            </div>

            {it.sets.map((st, si) => (
              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 30, height: 34, borderRadius: 10, background: t.accentSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: t.accent,
                }}>{si + 1}</div>
                {isReps ? (
                  <>
                    <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px' }}
                      value={(st as RepsSet).kg} onChange={e => setSetField(it.uid, si, 'kg', e.target.value)}
                      inputMode="decimal" placeholder="0" />
                    <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px' }}
                      value={(st as RepsSet).reps} onChange={e => setSetField(it.uid, si, 'reps', e.target.value)}
                      inputMode="numeric" placeholder="0" />
                  </>
                ) : (
                  <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px' }}
                    value={(st as DurationSet).sec} onChange={e => setSetField(it.uid, si, 'sec', e.target.value)}
                    inputMode="numeric" placeholder="30" />
                )}
                <button onClick={() => removeSet(it.uid, si)} style={{
                  width: 30, height: 30, borderRadius: 10, background: t.chip,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.sub, fontSize: 13, cursor: 'pointer',
                }}>−</button>
              </div>
            ))}
            <button onClick={() => addSet(it.uid)} style={{
              marginTop: 4, padding: 4, background: 'none', color: t.accent, fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>+ Add set</button>
          </div>
        );
      })}

      {items.length > 0 && (
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '16px 0', borderRadius: 16, fontSize: 16, marginTop: 6,
          boxShadow: 'var(--shadow)',
        }}>
          {saving ? 'Saving...' : `Save workout · ${items.length} ${items.length === 1 ? 'exercise' : 'exercises'}`}
        </button>
      )}
    </div>
  );
}
