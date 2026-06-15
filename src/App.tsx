import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExerciseProvider } from './context/ExerciseContext';
import { WorkoutProvider } from './context/WorkoutContext';
import LoginPage from './pages/LoginPage';
import ExercisesPage from './pages/ExercisesPage';
import AddExercisePage from './pages/AddExercisePage';
import WorkoutsPage from './pages/WorkoutsPage';
import WorkoutBuilderPage from './pages/WorkoutBuilderPage';
import WorkoutPlayerPage from './pages/WorkoutPlayerPage';
import MorePage from './pages/MorePage';
import AppearancePage from './pages/AppearancePage';

function AppShell() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 20, color: 'var(--sub)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const isPlayer = location.pathname.startsWith('/workouts/play/');

  if (isPlayer) {
    return (
      <ExerciseProvider>
        <WorkoutProvider>
          <Routes>
            <Route path="/workouts/play/:workoutId" element={<WorkoutPlayerPage />} />
          </Routes>
        </WorkoutProvider>
      </ExerciseProvider>
    );
  }

  return (
    <ExerciseProvider>
      <WorkoutProvider>
        <div className="app-shell">
          <nav className="sidebar">
            <div className="sidebar-brand">
              <span>🏋️</span> FitnessPro
            </div>
            <div className="sidebar-nav">
              <NavLink to="/exercises" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">📋</span> Exercises
              </NavLink>
              <NavLink to="/workouts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">🏋️</span> Workouts
              </NavLink>
            </div>
            <div className="sidebar-bottom">
              <NavLink to="/more" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">⋯</span> More
              </NavLink>
              <button className="sidebar-link" onClick={signOut} style={{ width: '100%' }}>
                <span className="icon">🚪</span> Sign Out
              </button>
            </div>
          </nav>
          <main className="main-content">
            <Routes>
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/new" element={<AddExercisePage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/workouts/new" element={<WorkoutBuilderPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/appearance" element={<AppearancePage />} />
              <Route path="*" element={<Navigate to="/exercises" replace />} />
            </Routes>
          </main>
        </div>
      </WorkoutProvider>
    </ExerciseProvider>
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
