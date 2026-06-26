import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
import { ActiveSessionProvider } from '../context/ActiveSessionContext';
import { ExerciseProvider } from '../context/ExerciseContext';
import { WorkoutProvider } from '../context/WorkoutContext';

export function AppDecorator(Story: React.ComponentType, { parameters }: any) {
  const initialEntries = parameters?.router?.initialEntries || ['/'];
  return (
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <ProfileProvider>
            <ActiveSessionProvider>
              <ExerciseProvider>
                <WorkoutProvider>
                  <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                    <Story />
                  </div>
                </WorkoutProvider>
              </ExerciseProvider>
            </ActiveSessionProvider>
          </ProfileProvider>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export function LoginDecorator(Story: React.ComponentType) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Story />
      </AuthProvider>
    </ThemeProvider>
  );
}
