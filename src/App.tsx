import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, type ThemeName } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExerciseProvider } from './context/ExerciseContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { ProfileProvider } from './context/ProfileContext';
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

const THEME_LIST: ThemeName[] = ['dark', 'light', 'kelly', 'navy'];

function ThemeSwitcher() {
  const { theme, setTheme, t, themeDots } = useTheme();
  return (
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
  );
}

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

  const isFullScreen = location.pathname.startsWith('/workouts/play/') ||
    location.pathname === '/exercises/new' ||
    location.pathname.startsWith('/exercises/edit/') ||
    location.pathname === '/workouts/new' ||
    location.pathname === '/profile' ||
    location.pathname === '/achievements' ||
    location.pathname === '/measurements';

  if (location.pathname.startsWith('/workouts/play/')) {
    return (
      <ProfileProvider>
        <ActiveSessionProvider>
          <ExerciseProvider>
            <WorkoutProvider>
              <div className="app-shell">
                <div className="main-content">
                  <Routes>
                    <Route path="/workouts/play/:workoutId" element={<WorkoutPlayerPage />} />
                  </Routes>
                </div>
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
              {!isFullScreen && <ThemeSwitcher />}
              <div className="main-content">
                <Routes>
                  <Route path="/exercises" element={<ExercisesPage toast={toast} />} />
                  <Route path="/exercises/new" element={<AddExercisePage toast={toast} />} />
                  <Route path="/exercises/edit/:exerciseId" element={<AddExercisePage toast={toast} />} />
                  <Route path="/workouts" element={<WorkoutsPage />} />
                  <Route path="/workouts/new" element={<WorkoutBuilderPage toast={toast} />} />
                  <Route path="/squad" element={<SquadPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/measurements" element={<MeasurementsPage />} />
                  <Route path="*" element={<Navigate to="/exercises" replace />} />
                </Routes>
              </div>
              {!isFullScreen && (
                <nav className="tab-bar">
                  <NavLink to="/exercises" className={({ isActive }) => `tab-bar-link ${isActive ? 'active' : ''}`}>
                    <DrillsIcon />
                    Drills
                  </NavLink>
                  <NavLink to="/workouts" className={({ isActive }) => `tab-bar-link ${isActive ? 'active' : ''}`}>
                    <SessionsIcon />
                    Sessions
                  </NavLink>
                  <NavLink to="/squad" className={({ isActive }) => `tab-bar-link ${isActive ? 'active' : ''}`}>
                    <SquadIcon />
                    Squad
                  </NavLink>
                </nav>
              )}
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
