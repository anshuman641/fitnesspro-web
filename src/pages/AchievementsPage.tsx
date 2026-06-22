import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useProfile, ACHIEVEMENT_DEFS } from '../context/ProfileContext';
import type { AchievementDef } from '../context/ProfileContext';

const CATEGORIES: { key: AchievementDef['category']; label: string }[] = [
  { key: 'workout', label: 'Workout' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'streak', label: 'Streak' },
  { key: 'social', label: 'Social' },
];

export default function AchievementsPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { achievements } = useProfile();

  const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
  const total = ACHIEVEMENT_DEFS.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn-back" onClick={() => navigate('/squad')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <h1 className="page-title" style={{ fontSize: 32 }}>Achievements</h1>
      </div>

      {/* Summary card */}
      <div style={{
        padding: '18px 16px', borderRadius: 3, background: t.surface,
        border: `1px solid ${t.line}`, marginBottom: 28, maxWidth: 400,
      }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, textTransform: 'uppercase', color: t.ink }}>
          {unlockedCount} / {total} Unlocked
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: t.chip, overflow: 'hidden', marginTop: 12 }}>
          <div style={{ height: '100%', borderRadius: 3, background: t.accent, width: `${pct}%`, transition: 'width .3s' }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: t.sub }}>
          {pct}% Complete
        </div>
      </div>

      {/* Category sections in grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {CATEGORIES.map(cat => {
          const defs = ACHIEVEMENT_DEFS.filter(d => d.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="section-label">{cat.label}</div>
              {defs.map(def => {
                const state = achievements[def.id];
                const unlocked = state?.unlocked ?? false;
                const unlockedAt = state?.unlockedAt;

                return (
                  <div key={def.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: `1px solid ${t.line}`,
                    opacity: unlocked ? 1 : 0.45,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 3, background: t.accentSoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>{def.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, textTransform: 'uppercase', color: t.ink }}>{def.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginTop: 2 }}>{def.description}</div>
                      {unlocked && unlockedAt && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                          {new Date(unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {unlocked ? (
                      <div style={{
                        width: 24, height: 24, borderRadius: 3, background: t.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6" /></svg>
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="7" width="8" height="7" rx="1" />
                          <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
