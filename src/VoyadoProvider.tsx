import React, { createContext } from 'react';

export const VoyadoContext = createContext({});

export const VoyadoProvider: React.FunctionComponent = ({ children }) => (
  <VoyadoContext.Provider value={{ voyado: true }}>
    {children}
  </VoyadoContext.Provider>
);
