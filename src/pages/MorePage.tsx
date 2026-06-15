import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ROADMAP = [
  { glyph: '🏠', title: 'Home & Today', desc: 'Daily overview and quick-start widgets' },
  { glyph: '📋', title: 'Programs', desc: 'Multi-week structured training plans' },
  { glyph: '📈', title: 'Progress', desc: 'Charts and personal records over time' },
  { glyph: '⏱', title: 'Timers', desc: 'Custom interval and tabata timers' },
  { glyph: '👤', title: 'Profile & Settings', desc: 'Account, units, notifications' },
];

export default function MorePage() {
  const { t } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="page-title">More</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: t.sub, marginTop: 4, marginBottom: 20 }}>
        What's coming next — and settings.
      </p>

      <div className="section-label">Roadmap</div>
      {ROADMAP.map(item => (
        <div key={item.title} className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: t.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}>{item.glyph}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 16, color: t.ink }}>{item.title}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginTop: 2 }}>{item.desc}</div>
          </div>
          <div style={{ padding: '5px 10px', borderRadius: 999, background: t.chip }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.sub }}>Planned</span>
          </div>
        </div>
      ))}

      <div className="section-label" style={{ marginTop: 24 }}>Settings</div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, cursor: 'pointer' }}
        onClick={() => navigate('/appearance')}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: t.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>🎨</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 16, color: t.ink }}>Appearance</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginTop: 2 }}>Theme & display</div>
        </div>
        <span style={{ color: t.sub, fontSize: 14 }}>▶</span>
      </div>
    </div>
  );
}
