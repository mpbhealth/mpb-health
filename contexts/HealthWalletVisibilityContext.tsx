import React, { createContext, useContext, useMemo, useState } from 'react';

type HealthWalletVisibilityContextValue = {
  routeFocused: boolean;
  setRouteFocused: (v: boolean) => void;
};

const HealthWalletVisibilityContext = createContext<HealthWalletVisibilityContextValue | null>(
  null,
);

export function HealthWalletVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [routeFocused, setRouteFocused] = useState(false);

  const value = useMemo(
    () => ({ routeFocused, setRouteFocused }),
    [routeFocused],
  );

  return (
    <HealthWalletVisibilityContext.Provider value={value}>
      {children}
    </HealthWalletVisibilityContext.Provider>
  );
}

export function useHealthWalletVisibility() {
  const ctx = useContext(HealthWalletVisibilityContext);
  if (!ctx) {
    throw new Error('useHealthWalletVisibility must be used within HealthWalletVisibilityProvider');
  }
  return ctx;
}
