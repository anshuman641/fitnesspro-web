import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useExercises } from '../context/ExerciseContext';

export default function AddExercisePage() {
  const { t } = useTheme();
  const { allTags, addExercise } = useExercises();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [media, setMedia] = useState<'photo' | 'video'>('photo');
  const [steps, setSteps] = useState(['']);
  const [tips, setTips] = useState(['']);
  const [donts, setDonts] = useState(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const updateItem = (arr: string[], i: number, v: string, setter: (a: string[]) => void) =>
    setter(arr.map((x, j) => j === i ? v : x));
  const removeItem = (arr: string[], i: number, setter: (a: string[]) => void) =>
    setter(arr.length > 1 ? arr.filter((_, j) => j !== i) : ['']);
  const addItem = (arr: string[], setter: (a: string[]) => void) =>
    setter([...arr, '']);

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);

  const handleSave = async () => {
    if (!name.trim()) { alert('Add a name first'); return; }
    setSaving(true);
    await addExercise({
      title: name.trim(),
      mediaUri: null,
      mediaType: media === 'photo' ? 'image' : 'video',
      isPublic: false,
      tags: tags.length > 0 ? tags : ['No Equipment'],
      difficulty: 'Beginner',
      steps: steps.filter(s => s.trim()).map(s => ({ id: '', description: s.trim() })),
      tips: tips.filter(s => s.trim()).map(s => s.trim()),
      donts: donts.filter(s => s.trim()).map(s => s.trim()),
    });
    setSaving(false);
    navigate('/exercises');
  };

  const segStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '9px 0', borderRadius: 10, textAlign: 'center',
    background: active ? t.surface : 'transparent', fontWeight: 800, fontSize: 13,
    color: active ? t.accent : t.sub, cursor: 'pointer',
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-back" onClick={() => navigate('/exercises')}>‹</button>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: t.ink }}>New Exercise</h1>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Save'}</button>
      </div>

      {/* Name */}
      <div className="label">Name</div>
      <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bodyweight Squat" />

      {/* Media */}
      <div className="label" style={{ marginTop: 20 }}>Photo or Video</div>
      <div style={{ display: 'flex', gap: 6, padding: 5, borderRadius: 13, background: t.chip, marginBottom: 12 }}>
        <button onClick={() => setMedia('photo')} style={segStyle(media === 'photo')}>Photo</button>
        <button onClick={() => setMedia('video')} style={segStyle(media === 'video')}>Video</button>
      </div>
      <div style={{
        height: 160, borderRadius: 16, border: `1.5px dashed ${t.line}`, background: t.chip,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, background: t.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.accent, fontSize: 22, fontWeight: 600,
        }}>+</div>
        <span style={{ fontWeight: 800, fontSize: 13.5, color: t.ink }}>Add a {media}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: t.sub, opacity: 0.7 }}>tap to upload from library</span>
      </div>

      {/* Steps */}
      <div className="label" style={{ marginTop: 22 }}>Steps</div>
      {steps.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 9, background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: t.accent, flexShrink: 0,
          }}>{i + 1}</div>
          <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(steps, i, e.target.value, setSteps)} placeholder="Describe this step" />
          <button onClick={() => removeItem(steps, i, setSteps)} style={{
            width: 30, height: 30, borderRadius: 10, background: t.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.sub, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>✕</button>
        </div>
      ))}
      <button onClick={() => addItem(steps, setSteps)} style={{
        marginTop: 4, border: `1.5px dashed ${t.line}`, borderRadius: 12,
        padding: '9px 15px', color: t.accent, fontWeight: 800, fontSize: 13.5,
        background: 'none', cursor: 'pointer',
      }}>+ Add step</button>

      {/* Tips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 10 }}>
        <div className="label" style={{ margin: 0 }}>Tips</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, opacity: 0.7 }}>optional</span>
      </div>
      {tips.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ width: 9, height: 9, borderRadius: 99, background: t.accent, flexShrink: 0 }} />
          <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(tips, i, e.target.value, setTips)} placeholder="A helpful cue" />
          <button onClick={() => removeItem(tips, i, setTips)} style={{
            width: 30, height: 30, borderRadius: 10, background: t.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.sub, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>✕</button>
        </div>
      ))}
      <button onClick={() => addItem(tips, setTips)} style={{
        marginTop: 4, border: `1.5px dashed ${t.line}`, borderRadius: 12,
        padding: '9px 15px', color: t.accent, fontWeight: 800, fontSize: 13.5,
        background: 'none', cursor: 'pointer',
      }}>+ Add tip</button>

      {/* Donts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 10 }}>
        <div className="label" style={{ margin: 0 }}>Things to Avoid</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, opacity: 0.7 }}>optional</span>
      </div>
      {donts.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ width: 9, height: 9, borderRadius: 99, background: t.danger, flexShrink: 0 }} />
          <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(donts, i, e.target.value, setDonts)} placeholder="A common mistake" />
          <button onClick={() => removeItem(donts, i, setDonts)} style={{
            width: 30, height: 30, borderRadius: 10, background: t.chip,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.sub, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>✕</button>
        </div>
      ))}
      <button onClick={() => addItem(donts, setDonts)} style={{
        marginTop: 4, border: `1.5px dashed ${t.line}`, borderRadius: 12,
        padding: '9px 15px', color: t.danger, fontWeight: 800, fontSize: 13.5,
        background: 'none', cursor: 'pointer',
      }}>+ Add item</button>

      {/* Tags */}
      <div className="label" style={{ marginTop: 22 }}>Tags</div>
      <div className="chip-row">
        {allTags.map(tag => (
          <button key={tag} className={`chip ${tags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input className="input" style={{ flex: 1 }} value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Create a new tag" />
        <button className="btn-primary" onClick={() => {
          if (newTag.trim()) { toggleTag(newTag.trim()); setNewTag(''); }
        }}>Add</button>
      </div>
    </div>
  );
}
