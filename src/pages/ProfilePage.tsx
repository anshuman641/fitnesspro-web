import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

export default function ProfilePage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { profile, setProfile, stats, xp, level, xpForNextLevel, xpProgress } = useProfile();
  const [goalInput, setGoalInput] = useState('');

  const monogram = profile.displayName.trim() ? profile.displayName.trim()[0].toUpperCase() : '?';

  const addGoal = () => {
    const g = goalInput.trim();
    if (!g || profile.goals.length >= 5) return;
    setProfile({ goals: [...profile.goals, g] });
    setGoalInput('');
  };

  const removeGoal = (i: number) => {
    setProfile({ goals: profile.goals.filter((_, j) => j !== i) });
  };

  const STAT_CARDS: { label: string; value: number }[] = [
    { label: 'Total Workouts', value: stats.totalWorkouts },
    { label: 'Total Minutes', value: stats.totalMinutes },
    { label: 'Current Streak', value: stats.currentStreak },
    { label: 'Longest Streak', value: stats.longestStreak },
    { label: 'Drills Created', value: stats.exercisesCreated },
    { label: 'Shared', value: stats.workoutsShared },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 18px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0,
      }}>
        <button className="btn-back" onClick={() => navigate('/squad')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '.04em', textTransform: 'uppercase', color: t.ink }}>Profile</div>
        <div style={{ width: 40 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 28px', scrollbarWidth: 'none' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 3, background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Anton', sans-serif", fontSize: 38, color: t.accent, cursor: 'pointer',
          }}>
            {profile.avatarUri
              ? <img src={profile.avatarUri} alt="" style={{ width: 88, height: 88, borderRadius: 3, objectFit: 'cover' }} />
              : monogram}
          </div>
        </div>

        {/* Name */}
        <div className="section-label" style={{ margin: '0 0 9px' }}>Name</div>
        <input
          className="input"
          value={profile.displayName}
          onChange={e => setProfile({ displayName: e.target.value })}
          placeholder="Your name"
        />

        {/* Bio */}
        <div className="section-label" style={{ margin: '20px 0 9px' }}>Bio</div>
        <input
          className="input"
          value={profile.bio}
          onChange={e => setProfile({ bio: e.target.value })}
          placeholder="A short bio"
        />

        {/* Goals */}
        <div className="section-label" style={{ margin: '20px 0 9px' }}>Goals ({profile.goals.length}/5)</div>
        {profile.goals.map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              flex: 1, padding: '11px 14px', borderRadius: 3, border: `1px solid ${t.line}`,
              background: t.surface, color: t.ink, fontSize: 14, fontWeight: 700,
            }}>{g}</div>
            <button onClick={() => removeGoal(i)} style={{
              width: 30, height: 30, flexShrink: 0, borderRadius: 3, border: `1px solid ${t.line}`,
              background: 'transparent', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l7 7M10 3l-7 7" /></svg>
            </button>
          </div>
        ))}
        {profile.goals.length < 5 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input className="input" style={{ flex: 1 }} value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="Add a goal" onKeyDown={e => { if (e.key === 'Enter') addGoal(); }} />
            <button className="btn-primary" onClick={addGoal}>Add</button>
          </div>
        )}

        {/* XP & Level */}
        <div className="section-label" style={{ margin: '28px 0 10px' }}>Level</div>
        <div style={{
          padding: '16px', borderRadius: 3, background: t.surface, border: `1px solid ${t.line}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              padding: '4px 10px', borderRadius: 2, background: level.color,
              fontFamily: "'Anton', sans-serif", fontSize: 13, color: '#fff', textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}>{level.name}</div>
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%', height: 6, borderRadius: 3, background: t.chip, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3, background: t.accent,
              width: `${Math.round(xpProgress * 100)}%`, transition: 'width .3s',
            }} />
          </div>
          <div style={{
            marginTop: 8, fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: t.sub,
          }}>
            {xp} / {xpForNextLevel} XP
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="section-label" style={{ margin: '28px 0 10px' }}>Stats</div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {STAT_CARDS.map(card => (
            <div key={card.label} style={{
              padding: '16px 14px', borderRadius: 3, background: t.surface,
              border: `1px solid ${t.line}`,
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif", fontSize: 24, color: t.ink,
              }}>{card.value}</div>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: t.sub, marginTop: 4,
              }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
