import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme, type ThemeName } from './context/ThemeContext';
import logoPng from './assets/logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExerciseProvider } from './context/ExerciseContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ActiveSessionProvider } from './context/ActiveSessionContext';
import LoginPage from './pages/LoginPage';
import ExercisesPage from './pages/ExercisesPage';
import AddExercisePage from './pages/AddExercisePage';
import WorkoutsPage from './pages/WorkoutsPage';
import WorkoutBuilderPage from './pages/WorkoutBuilderPage';
import WorkoutPlayerPage from './pages/WorkoutPlayerPage';
import SquadPage from './pages/MorePage';
import ProfilePage from './pages/ProfilePage';
import AchievementsPage from './pages/AchievementsPage';
import MeasurementsPage from './pages/MeasurementsPage';

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => setMsg(m), []);
  const clear = useCallback(() => setMsg(null), []);
  return { msg, show, clear };
}

function DrillsIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="16" height="16" rx="2" />
      <path d="M7 8h8M7 12h5" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="9,5 18,11 9,17" />
    </svg>
  );
}

function SquadIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="8" r="3" />
      <path d="M5 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}

function AchievementsIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 12.8 7.8 15l.8-4.7L5.2 7l4.7-.7z" />
    </svg>
  );
}

function MeasurementsIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 18V6M4 6l4 2M4 10l4 2M4 14l4 2M18 18V4" />
    </svg>
  );
}

function SidebarUserBlock() {
  const { t } = useTheme();
  const { profile, level, xp } = useProfile();
  const navigate = useNavigate();
  const monogram = profile.displayName.trim() ? profile.displayName.trim()[0].toUpperCase() : '?';

  return (
    <div className="sidebar-footer">
      <div className="sidebar-user" onClick={() => navigate('/profile')}>
        <div style={{
          width: 36, height: 36, borderRadius: 3, background: t.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Anton', sans-serif", fontSize: 16, color: t.accent, flexShrink: 0,
        }}>{monogram}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 800, color: t.ink, letterSpacing: '.04em',
            textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{profile.displayName || 'Set up profile'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
              padding: '2px 6px', borderRadius: 2, background: level.color, color: '#fff',
            }}>{level.name}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: t.sub }}>{xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-row">
          <img src={logoPng} alt="Logo" className="brand-logo" />
          <div>
            <h1>Foyard</h1>
            <div className="brand-sub">Foy Farm + Fitness</div>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/exercises" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <DrillsIcon /> Drills
        </NavLink>
        <NavLink to="/workouts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <SessionsIcon /> Sessions
        </NavLink>
        <NavLink to="/squad" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <SquadIcon /> Squad
        </NavLink>
        <div style={{ height: 1, background: 'var(--line)', margin: '8px 24px' }} />
        <NavLink to="/achievements" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <AchievementsIcon /> Achievements
        </NavLink>
        <NavLink to="/measurements" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MeasurementsIcon /> Measurements
        </NavLink>
      </nav>
      <SidebarUserBlock />
    </aside>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink to="/exercises" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <DrillsIcon /> Drills
      </NavLink>
      <NavLink to="/workouts" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <SessionsIcon /> Sessions
      </NavLink>
      <NavLink to="/squad" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <SquadIcon /> Squad
      </NavLink>
    </nav>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const { t } = useTheme();
  const location = useLocation();
  const toast = useToast();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)' }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: 'var(--sub)', textTransform: 'uppercase' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const isFullScreen = location.pathname.startsWith('/workouts/play/');

  if (location.pathname.startsWith('/workouts/play/')) {
    return (
      <ProfileProvider>
        <ActiveSessionProvider>
          <ExerciseProvider>
            <WorkoutProvider>
              <div className="main-content fullscreen">
                <Routes>
                  <Route path="/workouts/play/:workoutId" element={<WorkoutPlayerPage />} />
                </Routes>
              </div>
              {toast.msg && <Toast message={toast.msg} onDone={toast.clear} />}
            </WorkoutProvider>
          </ExerciseProvider>
        </ActiveSessionProvider>
      </ProfileProvider>
    );
  }

  return (
    <ProfileProvider>
      <ActiveSessionProvider>
        <ExerciseProvider>
          <WorkoutProvider>
            <div className="app-shell">
              {!isFullScreen && <Sidebar />}
              <div className={`main-content ${isFullScreen ? 'fullscreen' : ''}`}>
                <Routes>
                  <Route path="/exercises" element={<ExercisesPage toast={toast} />} />
                  <Route path="/exercises/new" element={<AddExercisePage toast={toast} />} />
                  <Route path="/exercises/edit/:exerciseId" element={<AddExercisePage toast={toast} />} />
                  <Route path="/workouts" element={<WorkoutsPage />} />
                  <Route path="/workouts/new" element={<WorkoutBuilderPage toast={toast} />} />
                  <Route path="/workouts/edit/:workoutId" element={<WorkoutBuilderPage toast={toast} />} />
                  <Route path="/squad" element={<SquadPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/measurements" element={<MeasurementsPage />} />
                  <Route path="*" element={<Navigate to="/exercises" replace />} />
                </Routes>
              </div>
              {!isFullScreen && <MobileNav />}
            </div>
            {toast.msg && <Toast message={toast.msg} onDone={toast.clear} />}
          </WorkoutProvider>
        </ExerciseProvider>
      </ActiveSessionProvider>
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
