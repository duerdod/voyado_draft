import {
  createActivationMachine,
  VoyadoProviderSettings,
  VoyadoActivationContext,
} from './GlobalActivation';
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

import LoginExternalCustomer from './LoginExternalCustomer.gql';
import ActivateExternalCustomerByToken from './ActivateExternalCustomerByToken.gql';

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
          return;
        },
        (error: any) => {
          return Promise.reject(error);
        }
      );
  }

  function tryActivateByToken(context: VoyadoActivationContext) {
    return client
      .mutate({
        mutation: ActivateExternalCustomerByToken,
        variables: {
          input: { externalCustomerToken: context.externalCustomerToken },
        },
      })
      .then(
        ({
          data,
        }: MutationResult<{
          activateExternalCustomerByToken: ActivateExternalCustomerByTokenResult;
        }>) => {
          return Promise.resolve(data);
        },
        (error: any) => {
          return Promise.reject(error);
        }
      );
  }

  console.log(JSON.stringify(state.value));

  return {
    isCoolCustomer: state.context.providerSettings.isCoolCustomer,
  };
}
