import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

const ROADMAP = [
  { title: 'Home & Today', desc: 'Daily overview and quick-start widgets' },
  { title: 'Programs', desc: 'Multi-week structured training plans' },
  { title: 'Progress', desc: 'Charts and personal records over time' },
  { title: 'Timers', desc: 'Custom interval and tabata timers' },
];

const NAV_ITEMS = [
  { title: 'Profile', desc: 'Name, bio, goals, XP level & stats', path: '/profile' },
  { title: 'Achievements', desc: '15 badges across 4 categories', path: '/achievements' },
  { title: 'Measurements', desc: 'Track 11 body measurements', path: '/measurements' },
];

export default function SquadPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { level, xp, stats } = useProfile();

  return (
    <div className="page">
      <div className="page-eyebrow">// Base</div>
      <h1 className="page-title" style={{ marginTop: 7 }}>Squad</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 28 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 2, background: level.color, color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
        }}>{level.name}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: t.sub, letterSpacing: '.08em' }}>{xp} XP</span>
      </div>

      <div className="card-grid" style={{ marginBottom: 32 }}>
        {NAV_ITEMS.map(item => (
          <div key={item.title} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 20,
            background: t.surface, border: `1px solid ${t.line}`, borderRadius: 3,
            cursor: 'pointer', transition: 'border-color .15s',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, textTransform: 'uppercase', color: t.ink }}>{item.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 4 }}>{item.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={t.sub} strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4" /></svg>
          </div>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: 36 }}>
        {[
          { label: 'Workouts', value: stats.totalWorkouts },
          { label: 'Minutes', value: stats.totalMinutes },
          { label: 'Streak', value: stats.currentStreak },
          { label: 'Best Streak', value: stats.longestStreak },
        ].map(s => (
          <div key={s.label} style={{
            padding: '16px 14px', borderRadius: 3, background: t.surface, border: `1px solid ${t.line}`,
          }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 28, color: t.ink }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.sub, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginBottom: 12 }}>Roadmap</div>
      <div style={{ maxWidth: 640 }}>
        {ROADMAP.map((item, i) => (
          <div key={item.title} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
            borderTop: `1px solid ${t.line}`,
          }}>
            <div style={{
              fontFamily: "'Anton', sans-serif", fontSize: 23, color: t.sub, opacity: 0.45, width: 30, flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.ink }}>{item.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 4 }}>{item.desc}</div>
            </div>
            <div style={{ padding: '5px 10px', borderRadius: 2, border: `1px solid ${t.line}` }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub }}>Soon</span>
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${t.line}` }} />
      </div>

    </div>
  );
}
