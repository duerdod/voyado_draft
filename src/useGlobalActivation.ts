// @ts-nocheck

import qs from 'qs';
import {
  createActivationMachine,
  VoyadoProviderSettings,
} from './GlobalActivation';
import { useMachine } from '@xstate/react';
import { useLocation } from 'react-router';

export function useGlobalActivation(providerSettings: VoyadoProviderSettings) {
  const location = useLocation();
  const { externalId } = qs.parse(location.search, { ignoreQueryPrefix: true });

  const [state] = useMachine(createActivationMachine(providerSettings), {
    context: {
      externalId,
    },
  });

  console.log(state);
}
