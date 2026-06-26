import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

const THEME_LIST: ThemeName[] = ['dark', 'light', 'kelly', 'navy', 'valentino', 'valentino-pp'];

export default function ProfilePage() {
  const { t, theme, setTheme, themeDots } = useTheme();
  const { signOut } = useAuth();
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
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn-back" onClick={() => navigate('/squad')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <h1 className="page-title" style={{ fontSize: 32 }}>Profile</h1>
      </div>

      <div className="two-col">
        {/* Left column — form */}
        <div>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 3, background: t.accentSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Anton', sans-serif", fontSize: 34, color: t.accent, flexShrink: 0,
            }}>
              {profile.avatarUri
                ? <img src={profile.avatarUri} alt="" style={{ width: 80, height: 80, borderRadius: 3, objectFit: 'cover' }} />
                : monogram}
            </div>
            <div>
              <div style={{
                padding: '4px 10px', borderRadius: 2, background: level.color,
                fontFamily: "'Anton', sans-serif", fontSize: 13, color: '#fff', textTransform: 'uppercase',
                letterSpacing: '.06em', display: 'inline-block',
              }}>{level.name}</div>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: t.sub }}>
                {xp} / {xpForNextLevel} XP
              </div>
              <div style={{ width: 160, height: 4, borderRadius: 2, background: t.chip, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: t.accent, width: `${Math.round(xpProgress * 100)}%`, transition: 'width .3s' }} />
              </div>
            </div>
          </div>

          <div className="section-label" style={{ margin: '0 0 9px' }}>Name</div>
          <input className="input" value={profile.displayName} onChange={e => setProfile({ displayName: e.target.value })} placeholder="Your name" />

          <div className="section-label" style={{ margin: '20px 0 9px' }}>Bio</div>
          <input className="input" value={profile.bio} onChange={e => setProfile({ bio: e.target.value })} placeholder="A short bio" />

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

          {/* Theme Switcher */}
          <div className="section-label" style={{ margin: '28px 0 10px' }}>Theme</div>
          <div className="theme-switcher">
            {THEME_LIST.map(k => {
              const active = theme === k;
              return (
                <button key={k} className="theme-btn" onClick={() => setTheme(k)} style={{
                  background: active ? t.accent : 'transparent',
                  color: active ? '#fff' : t.sub,
                }}>
                  <span className="theme-dot" style={{
                    background: themeDots[k],
                    boxShadow: `inset 0 0 0 1px ${active ? 'rgba(255,255,255,.5)' : t.line}`,
                  }} />
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column — stats */}
        <div>
          <div className="section-label" style={{ margin: '0 0 10px' }}>Stats</div>
          <div className="stat-grid">
            {STAT_CARDS.map(card => (
              <div key={card.label} style={{
                padding: '16px 14px', borderRadius: 3, background: t.surface, border: `1px solid ${t.line}`,
              }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 28, color: t.ink }}>{card.value}</div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.sub, marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={signOut} style={{
        marginTop: 28, padding: '14px 32px', borderRadius: 3,
        border: `1px solid ${t.line}`, background: 'transparent',
        color: t.sub, fontWeight: 800, fontSize: 10, letterSpacing: '.14em',
        textTransform: 'uppercase', cursor: 'pointer',
      }}>Sign Out</button>
    </div>
  );
}
