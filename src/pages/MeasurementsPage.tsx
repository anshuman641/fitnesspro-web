import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

export default function MeasurementsPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { measurements, setMeasurement, measurementUnit, setMeasurementUnit } = useProfile();

  const logged = measurements.filter(m => m.value.trim() !== '').length;
  const total = measurements.length;
  const pct = total > 0 ? Math.round((logged / total) * 100) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '52px 18px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0,
      }}>
        <button className="btn-back" onClick={() => navigate('/squad')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
        </button>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '.04em', textTransform: 'uppercase', color: t.ink }}>Measurements</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 28px', scrollbarWidth: 'none' }}>
        {/* Unit toggle */}
        <div className="seg-track" style={{ marginBottom: 18 }}>
          <button
            className={`seg-btn ${measurementUnit === 'metric' ? 'active' : ''}`}
            onClick={() => setMeasurementUnit('metric')}
          >Metric</button>
          <button
            className={`seg-btn ${measurementUnit === 'imperial' ? 'active' : ''}`}
            onClick={() => setMeasurementUnit('imperial')}
          >Imperial</button>
        </div>

        {/* Progress */}
        <div style={{
          padding: '14px 16px', borderRadius: 3, background: t.surface,
          border: `1px solid ${t.line}`, marginBottom: 22,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: t.sub, marginBottom: 10,
          }}>
            {logged} of {total} logged
          </div>
          <div style={{
            width: '100%', height: 6, borderRadius: 3, background: t.chip, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3, background: t.accent,
              width: `${pct}%`, transition: 'width .3s',
            }} />
          </div>
        </div>

        {/* Measurement rows */}
        {measurements.map(m => (
          <div key={m.key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: `1px solid ${t.line}`,
          }}>
            {/* Label */}
            <div style={{
              flex: 1, fontFamily: "'Anton', sans-serif", fontSize: 14,
              textTransform: 'uppercase', color: t.ink,
            }}>{m.label}</div>

            {/* Input */}
            <input
              className="input"
              style={{
                width: 80, textAlign: 'right', padding: '10px 10px',
                fontSize: 14, fontWeight: 700,
              }}
              type="number"
              inputMode="decimal"
              value={m.value}
              onChange={e => setMeasurement(m.key, e.target.value)}
              placeholder="--"
            />

            {/* Unit */}
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
              textTransform: 'uppercase', color: t.sub, width: 24, flexShrink: 0,
            }}>{m.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
