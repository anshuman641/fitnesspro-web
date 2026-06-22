import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ActiveSessionContextType {
  isActive: boolean;
  setActive: (active: boolean) => void;
  confirmLeave: (onConfirm: () => void) => void;
}

const ActiveSessionContext = createContext<ActiveSessionContextType | null>(null);

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  const confirmLeave = useCallback((onConfirm: () => void) => {
    if (!isActive) {
      onConfirm();
      return;
    }
    if (window.confirm('Stop and leave? Your workout progress will be lost.')) {
      setIsActive(false);
      onConfirm();
    }
  }, [isActive]);

  return (
    <ActiveSessionContext.Provider value={{ isActive, setActive, confirmLeave }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession() {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) throw new Error('useActiveSession must be inside ActiveSessionProvider');
  return ctx;
}
