import React, { createContext, useContext } from 'react';

import { useGlobalActivation } from './hooks/useGlobalActivation';
import { VoyadoProviderOptions } from './states/GlobalActivation';

export const VoyadoContext = createContext({});

interface VoyadoProviderProps {
  children: React.ReactNode;
  options: VoyadoProviderOptions;
}

export const VoyadoProvider = (props: VoyadoProviderProps) => {
  const activationValues = useGlobalActivation({
    ...props.options,
  });
  return <VoyadoContext.Provider value={activationValues} {...props} />;
};

export function useGlobalActivationStatus() {
  const context = useContext(VoyadoContext);
  if (!context) {
    return Error('useGlobalActivationStatus cannot be used outside VoyadoProvider');
  }
  return context;
}
