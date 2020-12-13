import React, { createContext } from 'react';

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
