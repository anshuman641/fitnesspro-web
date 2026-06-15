import { useNavigate } from 'react-router-dom';
import { useTheme, THEMES, type ThemeName } from '../context/ThemeContext';

const THEME_META: { key: ThemeName; name: string; desc: string }[] = [
  { key: 'cream', name: 'Cream', desc: 'Warm & light. Green accent on off-white.' },
  { key: 'midnight', name: 'Midnight', desc: 'Dark & punchy. Lime accent on near-black.' },
  { key: 'sunrise', name: 'Sunrise', desc: 'Soft & warm. Coral accent on cream.' },
];

export default function AppearancePage() {
  const { t, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-back" onClick={() => navigate('/more')}>‹</button>
          <h1 style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: t.ink }}>Appearance</h1>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="section-label">Theme</div>

      {THEME_META.map(({ key, name, desc }) => {
        const tk = THEMES[key];
        const active = theme === key;
        return (
          <div key={key} onClick={() => setTheme(key)} style={{
            border: `2px solid ${active ? t.accent : t.line}`, borderRadius: 20, padding: 16,
            marginBottom: 12, background: t.card, boxShadow: 'var(--shadow)', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${tk.line}`,
                background: tk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '0 6px', flexShrink: 0,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: tk.accent }} />
                <div style={{ width: 10, height: 10, borderRadius: 5, background: tk.ink }} />
                <div style={{ width: 10, height: 10, borderRadius: 5, background: tk.surface }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 500, fontSize: 16, color: t.ink }}>{name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginTop: 2 }}>{desc}</div>
              </div>
              {active && (
                <div style={{
                  width: 30, height: 30, borderRadius: 15, background: t.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.onAccent, fontSize: 14, fontWeight: 800,
                }}>✓</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
