import React, { createContext } from 'react';
import { useGlobalActivation } from './useGlobalActivation';
import { VoyadoProviderSettings } from './GlobalActivation';

export const VoyadoContext = createContext({});

interface VoyadoProviderProps {
  children: React.ReactNode;
  settings: VoyadoProviderSettings;
}

export const VoyadoProvider = (props: VoyadoProviderProps) => {
  useGlobalActivation(props.settings);
  return <VoyadoContext.Provider value={{ voyado: true }} {...props} />;
};
