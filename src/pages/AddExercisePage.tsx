import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useExercises } from '../context/ExerciseContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Difficulty } from '../types';

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export default function AddExercisePage({ toast }: { toast?: { show: (m: string) => void } }) {
  const { t } = useTheme();
  const { allTags, loadTags, addExercise, updateExercise, deleteExercise, fetchExerciseById } = useExercises();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId?: string }>();
  const isEdit = !!exerciseId;

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [media, setMedia] = useState<'photo' | 'video'>('photo');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [steps, setSteps] = useState(['']);
  const [tips, setTips] = useState(['']);
  const [donts, setDonts] = useState(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTags(); }, [loadTags]);

  useEffect(() => {
    if (!isEdit || !exerciseId) return;
    fetchExerciseById(exerciseId).then(ex => {
      if (ex) {
        setName(ex.title);
        setDifficulty(ex.difficulty);
        setMedia(ex.mediaType === 'video' ? 'video' : 'photo');
        setSteps(ex.steps.length > 0 ? ex.steps.map(s => s.description) : ['']);
        setTips(ex.tips.length > 0 ? [...ex.tips] : ['']);
        setDonts(ex.donts.length > 0 ? [...ex.donts] : ['']);
        setTags([...ex.tags]);
        setIsPublic(ex.isPublic);
        if (ex.mediaUri) {
          setMediaUri(ex.mediaUri);
          setMediaPreview(ex.mediaUri);
        }
      }
    });
  }, [isEdit, exerciseId, fetchExerciseById]);

  const updateItem = (arr: string[], i: number, v: string, setter: (a: string[]) => void) =>
    setter(arr.map((x, j) => j === i ? v : x));
  const removeItem = (arr: string[], i: number, setter: (a: string[]) => void) =>
    setter(arr.length > 1 ? arr.filter((_, j) => j !== i) : ['']);
  const addItem = (arr: string[], setter: (a: string[]) => void) =>
    setter([...arr, '']);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast?.show('Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast?.show('File must be under 50 MB');
      return;
    }

    setMediaPreview(URL.createObjectURL(file));
    setMedia(isVideo ? 'video' : 'photo');
    setUploading(true);

    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('exercise-media')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error('Upload failed:', error.message);
      toast?.show('Upload failed — try again');
      setMediaPreview(null);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(path);

    setMediaUri(urlData.publicUrl);
    setUploading(false);
    toast?.show('Upload complete');
  };

  const handleRemoveMedia = () => {
    setMediaUri(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);

  const handleSave = async () => {
    if (!name.trim()) { toast?.show('Name your drill'); return; }
    setSaving(true);

    const payload = {
      title: name.trim(),
      mediaUri,
      mediaType: media === 'photo' ? 'image' as const : 'video' as const,
      isPublic,
      tags: tags.length > 0 ? tags : ['No Equipment'],
      difficulty,
      steps: steps.filter(s => s.trim()).map(s => ({ id: '', description: s.trim() })),
      tips: tips.filter(s => s.trim()).map(s => s.trim()),
      donts: donts.filter(s => s.trim()).map(s => s.trim()),
    };

    if (isEdit && exerciseId) {
      await updateExercise({ ...payload, id: exerciseId });
      toast?.show('Drill updated');
    } else {
      await addExercise(payload);
      toast?.show('Drill saved');
    }

    setSaving(false);
    navigate('/exercises');
  };

  const handleDelete = async () => {
    if (!exerciseId) return;
    if (!window.confirm('Delete this drill? This action cannot be undone.')) return;
    await deleteExercise(exerciseId);
    toast?.show('Drill deleted');
    navigate('/exercises');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0 }}>
        <button className="btn-back" onClick={() => navigate('/exercises')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '.04em', textTransform: 'uppercase', color: t.ink }}>{isEdit ? 'Edit Drill' : 'New Drill'}</div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Save'}</button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        <div className="form-panel">
        {/* Name */}
        <div className="section-label" style={{ margin: '2px 0 9px' }}>Name</div>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bodyweight Squat" />

        {/* Difficulty */}
        <div className="section-label" style={{ margin: '22px 0 9px' }}>Difficulty</div>
        <div className="seg-track" style={{ marginBottom: 12 }}>
          {DIFFICULTIES.map(d => (
            <button key={d} className={`seg-btn ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>
          ))}
        </div>

        {/* Media */}
        <div className="section-label" style={{ margin: '22px 0 9px' }}>Photo or video</div>
        <div className="seg-track" style={{ marginBottom: 12 }}>
          <button className={`seg-btn ${media === 'photo' ? 'active' : ''}`} onClick={() => { setMedia('photo'); if (!mediaUri) handleRemoveMedia(); }}>Photo</button>
          <button className={`seg-btn ${media === 'video' ? 'active' : ''}`} onClick={() => { setMedia('video'); if (!mediaUri) handleRemoveMedia(); }}>Video</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={media === 'video' ? 'video/*' : 'image/*'}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {mediaPreview ? (
          <div style={{ position: 'relative', width: '100%', borderRadius: 3, overflow: 'hidden', border: `1px solid ${t.line}` }}>
            {media === 'video' ? (
              <video src={mediaPreview} controls style={{ width: '100%', maxHeight: 240, display: 'block' }} />
            ) : (
              <img src={mediaPreview} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
            )}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
              }}>Uploading…</div>
            )}
            {!uploading && (
              <button onClick={handleRemoveMedia} style={{
                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', height: 160, borderRadius: 3, border: `1px dashed ${t.line}`,
              background: `repeating-linear-gradient(45deg, ${t.chip} 0 11px, transparent 11px 22px)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 3, background: t.accentSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M11 5v12M5 11h12" /></svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.ink }}>Add a {media}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: t.sub, opacity: 0.7 }}>tap to upload from library</div>
          </div>
        )}

        {/* Steps */}
        <div className="section-label" style={{ margin: '24px 0 10px' }}>Execution</div>
        {steps.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0, border: `1px solid ${t.line}`, color: t.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Anton', sans-serif", fontSize: 14, borderRadius: 2,
            }}>{i + 1}</div>
            <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(steps, i, e.target.value, setSteps)} placeholder="Describe this step" />
            <button onClick={() => removeItem(steps, i, setSteps)} style={{
              width: 30, height: 30, flexShrink: 0, borderRadius: 3, border: `1px solid ${t.line}`,
              background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
            </button>
          </div>
        ))}
        <button onClick={() => addItem(steps, setSteps)} style={{
          marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 7,
          border: `1px dashed ${t.line}`, background: 'transparent', color: t.accent,
          fontWeight: 800, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
          padding: '10px 15px', borderRadius: 3, cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 3v8M3 7h8" /></svg>
          Add step
        </button>

        {/* Tips / Cues */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 10px' }}>
          <span className="section-label" style={{ margin: 0 }}>Cues</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, opacity: 0.6 }}>Optional</span>
        </div>
        {tips.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <span style={{ width: 8, height: 8, flexShrink: 0, background: t.accent }} />
            <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(tips, i, e.target.value, setTips)} placeholder="A helpful cue" />
            <button onClick={() => removeItem(tips, i, setTips)} style={{
              width: 30, height: 30, flexShrink: 0, borderRadius: 3, border: `1px solid ${t.line}`,
              background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
            </button>
          </div>
        ))}
        <button onClick={() => addItem(tips, setTips)} style={{
          marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 7,
          border: `1px dashed ${t.line}`, background: 'transparent', color: t.accent,
          fontWeight: 800, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
          padding: '10px 15px', borderRadius: 3, cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 3v8M3 7h8" /></svg>
          Add cue
        </button>

        {/* Donts / No-Go */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 10px' }}>
          <span className="section-label" style={{ margin: 0 }}>No-Go</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub, opacity: 0.6 }}>Optional</span>
        </div>
        {donts.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <span style={{ width: 8, height: 8, flexShrink: 0, background: t.danger }} />
            <input className="input" style={{ flex: 1 }} value={v} onChange={e => updateItem(donts, i, e.target.value, setDonts)} placeholder="A common mistake" />
            <button onClick={() => removeItem(donts, i, setDonts)} style={{
              width: 30, height: 30, flexShrink: 0, borderRadius: 3, border: `1px solid ${t.line}`,
              background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
            </button>
          </div>
        ))}
        <button onClick={() => addItem(donts, setDonts)} style={{
          marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 7,
          border: `1px dashed ${t.line}`, background: 'transparent', color: t.danger,
          fontWeight: 800, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
          padding: '10px 15px', borderRadius: 3, cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M7 3v8M3 7h8" /></svg>
          Add no-go
        </button>

        {/* Visibility */}
        <div className="section-label" style={{ margin: '24px 0 9px' }}>Visibility</div>
        <div className="seg-track" style={{ marginBottom: 6 }}>
          <button className={`seg-btn ${!isPublic ? 'active' : ''}`} onClick={() => setIsPublic(false)}>Private</button>
          <button className={`seg-btn ${isPublic ? 'active' : ''}`} onClick={() => setIsPublic(true)}>Public</button>
        </div>
        {isPublic && (
          <div style={{ fontSize: 9, color: t.sub, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Public drills are visible to the entire community
          </div>
        )}

        {/* Tags */}
        <div className="section-label" style={{ margin: '24px 0 10px' }}>Tags</div>
        <div className="chip-row" style={{ padding: '0 0 8px' }}>
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

        {/* Delete button (edit mode only) */}
        {isEdit && (
          <button onClick={handleDelete} style={{
            width: '100%', padding: '16px 0', borderRadius: 3, fontSize: 11, fontWeight: 800,
            letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 28,
            background: 'transparent', color: t.danger, cursor: 'pointer',
            border: `1px solid ${t.danger}`,
          }}>
            Delete Drill
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
