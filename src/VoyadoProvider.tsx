import React, { createContext, useContext } from 'react';

import { useGlobalActivation } from './hooks/useGlobalActivation';
import { VoyadoProviderSettings } from './states/GlobalActivation';

export const VoyadoContext = createContext({});

interface VoyadoProviderProps {
  children: React.ReactNode;
  settings: VoyadoProviderSettings;
}

export const VoyadoProvider = (props: VoyadoProviderProps) => {
  const activationValues = useGlobalActivation({
    ...props.settings,
  });
  return <VoyadoContext.Provider value={activationValues} {...props} />;
};

export function useGlobalActivationValues() {
  const context = useContext(VoyadoContext);
  if (!context) {
    return Error('useGlobalActivationValues cannot be used outside VoyadoProvider');
  }
  return context;
}
