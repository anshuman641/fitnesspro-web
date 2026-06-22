import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ROADMAP = [
  { title: 'Home & Today', desc: 'Daily overview and quick-start widgets' },
  { title: 'Programs', desc: 'Multi-week structured training plans' },
  { title: 'Progress', desc: 'Charts and personal records over time' },
  { title: 'Timers', desc: 'Custom interval and tabata timers' },
  { title: 'Profile & Settings', desc: 'Account, units, notifications' },
];

export default function SquadPage() {
  const { t } = useTheme();
  const { signOut } = useAuth();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '54px 22px 26px', scrollbarWidth: 'none' }}>
        <div className="page-eyebrow">// Base</div>
        <h1 className="page-title" style={{ marginTop: 7 }}>Squad</h1>
        <p style={{ fontSize: 12, fontWeight: 600, color: t.sub, marginTop: 10, marginBottom: 20, lineHeight: 1.5 }}>
          What's coming next for FitnessPro. Features below are on the roadmap.
        </p>

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
