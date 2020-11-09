// @ts-nocheck

import React, { createContext, useEffect } from 'react';
import { useLocation } from 'react-router';
import qs from 'qs';
import { useApolloClient } from '@apollo/react-hooks';
import useAuth from '@jetshop/core/components/AuthContext/useAuth';

import { useGlobalActivation } from './useGlobalActivation';
import { VoyadoProviderSettings } from './GlobalActivation';
import LoginExternalCustomer from './LoginExternalCustomer.gql';

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
