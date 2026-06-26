import { useNavigate } from 'react-router-dom';
import { useTheme, THEMES, type ThemeName } from '../context/ThemeContext';

const THEME_META: { key: ThemeName; name: string; desc: string }[] = [
  { key: 'dark', name: 'Dark', desc: 'Neutral near-black with electric blue accent.' },
  { key: 'light', name: 'Light', desc: 'Cool white with blue accent.' },
  { key: 'kelly', name: 'Kelly', desc: 'Green-tinted dark with kelly green accent.' },
  { key: 'navy', name: 'Navy', desc: 'Deep navy with royal blue accent.' },
  { key: 'valentino', name: 'Valentino', desc: 'Dark rose with Valentino pink accent.' },
  { key: 'valentino-pp', name: 'Valentino PP', desc: 'Deep purple-black with electric violet accent.' },
];

export default function AppearancePage() {
  const { t, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '54px 22px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn-back" onClick={() => navigate('/squad')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.ink }}>Appearance</h1>
      </div>

      <div className="section-label">Theme</div>

      {THEME_META.map(({ key, name, desc }) => {
        const tk = THEMES[key];
        const active = theme === key;
        return (
          <div key={key} onClick={() => setTheme(key)} style={{
            border: `1px solid ${active ? t.accent : t.line}`, borderRadius: 3, padding: 16,
            marginBottom: 10, background: t.card, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 3, border: `1px solid ${tk.line}`,
                background: tk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, padding: '0 6px', flexShrink: 0,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tk.accent }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tk.ink }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: tk.surface }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: t.ink }}>{name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 2 }}>{desc}</div>
              </div>
              {active && (
                <div style={{
                  width: 28, height: 28, borderRadius: 3, background: t.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6" /></svg>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
