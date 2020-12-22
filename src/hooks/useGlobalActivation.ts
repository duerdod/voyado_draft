import { useEffect } from 'react';

import { createActivationMachine, VoyadoProviderOptions } from '../states/GlobalActivation';
import { useMachine } from '@xstate/react';

import { useApolloClient } from '@apollo/react-hooks';

import useAuth from '@jetshop/core/components/AuthContext/useAuth';

import { useLocation, useHistory } from 'react-router';
import qs from 'qs';

import * as resolver from '../resolvers';

export function useGlobalActivation(providerOptions: VoyadoProviderOptions) {
  const history = useHistory();
  const client = useApolloClient();
  const { search } = useLocation();
  const { loggedIn, logIn } = useAuth();
  const { eclub = '' } = qs.parse(search, { ignoreQueryPrefix: true });

  const [state] = useMachine(createActivationMachine(providerOptions), {
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

  // console.log('GlobalActivationState: ', JSON.stringify(state.value));

  const states = {
    isAdditionalDataRequired: state.matches('action_required.activation_failed.additional_data'),
    isNonExistingCustomer: state.matches('action_required.activation_failed.non_existing'),
    isActivationRequired: state.matches('action_required.activation_failed.already_activated'),
    // The following might cause impossible states...
    isActionPending:
      state.matches('checking_action_required') ||
      state.matches('action_required.try_activate') ||
      state.matches('action_required.activation_failed.status_response'),
  };

  useEffect(() => {
    if (states.isAdditionalDataRequired) {
      history.push(providerOptions.signupPath || '/signup', {
        customer: { ...state.context.customer },
      });
    }
  }, [states.isAdditionalDataRequired]);

  return {
    ...states,
  };
}
