import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const ROADMAP = [
  { title: 'Home & Today', desc: 'Daily overview and quick-start widgets' },
  { title: 'Programs', desc: 'Multi-week structured training plans' },
  { title: 'Progress', desc: 'Charts and personal records over time' },
  { title: 'Timers', desc: 'Custom interval and tabata timers' },
  { title: 'Profile & Settings', desc: 'Account, units, notifications' },
];

const NAV_ITEMS = [
  { title: 'Profile', desc: 'Name, bio, goals, XP level & stats', path: '/profile' },
  { title: 'Achievements', desc: '15 badges across 4 categories', path: '/achievements' },
  { title: 'Measurements', desc: 'Track 11 body measurements', path: '/measurements' },
];

export default function SquadPage() {
  const { t } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { level, xp } = useProfile();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '54px 22px 26px', scrollbarWidth: 'none' }}>
        <div className="page-eyebrow">// Base</div>
        <h1 className="page-title" style={{ marginTop: 7 }}>Squad</h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 20,
        }}>
          <span style={{
            padding: '4px 10px', borderRadius: 2, background: level.color, color: '#fff',
            fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
          }}>{level.name}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: t.sub, letterSpacing: '.08em' }}>{xp} XP</span>
        </div>

        {NAV_ITEMS.map((item, i) => (
          <div key={item.title} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
            borderTop: `1px solid ${t.line}`, cursor: 'pointer',
          }}>
            <div style={{
              fontFamily: "'Anton', sans-serif", fontSize: 23, color: t.accent, opacity: 0.7, width: 30, flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.ink }}>{item.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 4 }}>{item.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={t.sub} strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4" /></svg>
          </div>
        ))}

        <div style={{ marginTop: 12, marginBottom: 8, fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.sub }}>Roadmap</div>

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
            <div style={{
              padding: '5px 10px', borderRadius: 2, border: `1px solid ${t.line}`,
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: t.sub }}>Soon</span>
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${t.line}` }} />

        <button onClick={signOut} style={{
          marginTop: 28, width: '100%', padding: '14px 0', borderRadius: 3,
          border: `1px solid ${t.line}`, background: 'transparent',
          color: t.sub, fontWeight: 800, fontSize: 10, letterSpacing: '.14em',
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Sign Out</button>
      </div>
    </div>
  );
}
