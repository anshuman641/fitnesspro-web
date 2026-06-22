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

export default function WorkoutBuilderPage({ toast }: { toast?: { show: (m: string) => void } }) {
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
    if (!wkName.trim()) { toast?.show('Name your session'); return; }
    if (!items.length) { toast?.show('Add at least one drill'); return; }
    setSaving(true);
    await saveWorkout({
      name: wkName.trim(),
      items: items.map(({ exerciseId, mode, sets }) => ({ exerciseId, mode, sets })),
      isPublic: false,
    });
    setSaving(false);
    toast?.show('Session saved');
    navigate('/workouts');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 18px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0 }}>
        <button className="btn-back" onClick={() => navigate('/workouts')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <h1 style={{ flex: 1, fontFamily: "'Anton', sans-serif", fontSize: 20, letterSpacing: '.04em', textTransform: 'uppercase', color: t.ink }}>Build Session</h1>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 28px', scrollbarWidth: 'none' }}>
        <input className="input" value={wkName} onChange={e => setWkName(e.target.value)} placeholder="Session name — e.g. Morning Reset" />

        <div className="search-box" style={{ marginTop: 14 }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke={t.sub} strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M16 16l-3.6-3.6" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH DRILLS TO ADD" />
        </div>

        <div className="chip-row" style={{ padding: '12px 0 8px' }}>
          <button className={`chip ${selectedTags.length === 0 ? 'active' : ''}`} onClick={() => setSelectedTags([])}>All</button>
          {allTags.map(tag => (
            <button key={tag} className={`chip ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
          ))}
        </div>

        {/* Candidate list */}
        {candidates.map(ex => {
          const added = items.some(i => i.exerciseId === ex.id);
          return (
            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.line}` }}>
              <div className="monogram">{ex.title[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, lineHeight: 1, letterSpacing: '.02em', textTransform: 'uppercase', color: t.ink }}>{ex.title}</div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, marginTop: 4 }}>
                  {ex.difficulty} · {ex.tags.join(', ')}
                </div>
              </div>
              <button onClick={() => toggleExercise(ex.id)} style={{
                width: 40, height: 40, borderRadius: 3,
                background: added ? t.accent : 'transparent',
                border: added ? 'none' : `1px solid ${t.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: added ? '#fff' : t.accent, cursor: 'pointer',
              }}>
                {added ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 4 6-8" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
                )}
              </button>
            </div>
          );
        })}

        {/* Selected items */}
        {items.length > 0 && (
          <div className="section-label" style={{ marginTop: 22 }}>Your Session ({items.length})</div>
        )}

        {items.map(it => {
          const ex = allEx.find(e => e.id === it.exerciseId);
          if (!ex) return null;
          const isReps = it.mode === 'reps';
          return (
            <div key={it.uid} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: 3, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                <div className="monogram monogram-sm">{ex.title[0]}</div>
                <span style={{ flex: 1, fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: t.ink }}>{ex.title}</span>
                <button onClick={() => toggleExercise(it.exerciseId)} style={{
                  width: 30, height: 30, borderRadius: 3, border: `1px solid ${t.line}`,
                  background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
                </button>
              </div>

              <div className="seg-track" style={{ marginBottom: 12 }}>
                <button className={`seg-btn ${isReps ? 'active' : ''}`} onClick={() => setMode(it.uid, 'reps')}>Reps & weight</button>
                <button className={`seg-btn ${!isReps ? 'active' : ''}`} onClick={() => setMode(it.uid, 'duration')}>Duration</button>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingLeft: 4, paddingBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, width: 30 }}>Set</span>
                {isReps ? (
                  <>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Kg</span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Reps</span>
                  </>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, flex: 1, textAlign: 'center' }}>Seconds</span>
                )}
                <div style={{ width: 30 }} />
              </div>

              {it.sets.map((st, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 30, height: 34, borderRadius: 2, border: `1px solid ${t.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Anton', sans-serif", fontSize: 13, color: t.accent,
                  }}>{si + 1}</div>
                  {isReps ? (
                    <>
                      <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px', background: t.bg }}
                        value={(st as RepsSet).kg} onChange={e => setSetField(it.uid, si, 'kg', e.target.value)}
                        inputMode="decimal" placeholder="0" />
                      <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px', background: t.bg }}
                        value={(st as RepsSet).reps} onChange={e => setSetField(it.uid, si, 'reps', e.target.value)}
                        inputMode="numeric" placeholder="0" />
                    </>
                  ) : (
                    <input className="input" style={{ flex: 1, height: 38, textAlign: 'center', padding: '0 8px', background: t.bg }}
                      value={(st as DurationSet).sec} onChange={e => setSetField(it.uid, si, 'sec', e.target.value)}
                      inputMode="numeric" placeholder="30" />
                  )}
                  <button onClick={() => removeSet(it.uid, si)} style={{
                    width: 30, height: 30, borderRadius: 3, border: `1px solid ${t.line}`,
                    background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 5.5h7" /></svg>
                  </button>
                </div>
              ))}
              <button onClick={() => addSet(it.uid)} style={{
                marginTop: 4, padding: 4, background: 'none', color: t.accent, fontWeight: 800, fontSize: 10,
                letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
              }}>+ Add set</button>
            </div>
          );
        })}

        {items.length > 0 && (
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '16px 0', borderRadius: 3, fontSize: 11, fontWeight: 800,
            letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 6,
            background: t.accent, color: '#fff', cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : `Save session · ${items.length} ${items.length === 1 ? 'drill' : 'drills'}`}
          </button>
        )}
      </div>
    </div>
  );
}
