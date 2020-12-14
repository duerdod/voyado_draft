import { createActivationMachine, VoyadoProviderSettings } from '../states/GlobalActivation';
import { useMachine } from '@xstate/react';

import { useApolloClient } from '@apollo/react-hooks';

import useAuth from '@jetshop/core/components/AuthContext/useAuth';

import { useLocation } from 'react-router';
import qs from 'qs';

import * as resolver from '../resolver';

export function useGlobalActivation(providerSettings: VoyadoProviderSettings) {
  const client = useApolloClient();
  const { search } = useLocation();
  const { loggedIn, logIn } = useAuth();
  const { eclub = '' } = qs.parse(search, { ignoreQueryPrefix: true });

  const [state] = useMachine(createActivationMachine(providerSettings), {
    context: {
      externalCustomerToken: encodeURIComponent(eclub as string),
    },
    services: {
      tryLogin: context => {
        return resolver.tryLogin(context, {
          client,
          callback: logIn,
        });
      },
      tryActivateByToken: context => {
        return resolver.tryActivateByToken(context, { client });
      },
    },
    guards: {
      shouldInitialize: () => (eclub as string).length > 0 && !loggedIn,
    },
  });

  console.log('GlobalActivationState: ', JSON.stringify(state.value));
  // console.log(state.context)

  const states = {
    isAdditionalDataRequired: state.matches('action_required.activation_failed.additional_data'),
    isNonExistingCustomer: state.matches('action_required.activation_failed.non_existing'),
    isActivationRequired: state.matches('action_required.activation_failed.already_activated'),
  };

  return {
    ...states,
  };
}
