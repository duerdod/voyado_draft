import {
  createActivationMachine,
  VoyadoProviderSettings,
  VoyadoActivationContext,
} from '../states/GlobalActivation';
import { useMachine } from '@xstate/react';

import { useApolloClient } from '@apollo/react-hooks';
import { MutationResult } from '@apollo/react-common/lib/types/types';
import useAuth from '@jetshop/core/components/AuthContext/useAuth';
import {
  LoginExternalCustomerResult,
  ActivateExternalCustomerByTokenResult,
} from '@jetshop/core/types';
import { useLocation } from 'react-router';
import qs from 'qs';

import LoginExternalCustomer from '../queries/LoginExternalCustomer.gql';
import ActivateExternalCustomerByToken from '../queries/ActivateExternalCustomerByToken.gql';

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
      tryLogin,
      tryActivateByToken,
    },
    guards: {
      shouldInitialize: () => (eclub as string).length > 0 && !loggedIn,
    },
  });

  function tryLogin(context: VoyadoActivationContext) {
    return client
      .mutate({
        mutation: LoginExternalCustomer,
        variables: {
          input: {
            externalCustomerToken: context.externalCustomerToken,
          },
        },
      })
      .then(
        ({ data }: MutationResult<{ loginExternalCustomer: LoginExternalCustomerResult }>) => {
          if (data?.loginExternalCustomer.token?.value) {
            return Promise.resolve(logIn(data?.loginExternalCustomer?.token?.value));
          }
          return Promise.reject();
        },
        (error: any) => {
          return Promise.reject(error);
        }
      );
  }

  function tryActivateByToken(context: VoyadoActivationContext) {
    return (
      client
        .mutate({
          mutation: ActivateExternalCustomerByToken,
          variables: {
            input: { externalCustomerToken: context.externalCustomerToken },
          },
          errorPolicy: 'all',
        })
        // Change this when API is returning a status like we do on external lookup.
        // If we got a status, we could just forward them as event.type.
        .then((response: any) => {
          const data: MutationResult<{
            activateExternalCustomerByToken: ActivateExternalCustomerByTokenResult;
          }> = response.data;

          const error: any = response.errors;

          if (error) {
            return Promise.reject({ error: { ...error }, ...data });
          }
          return Promise.resolve(data);
        })
    );
  }

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
