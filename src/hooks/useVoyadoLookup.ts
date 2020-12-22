import { useMachine } from '@xstate/react';
import {
  LookupMachine,
  LookupContext,
  LookupEvents,
  defaultLookupOptions,
} from '../states/ExternalLookup';
import { useApolloClient } from '@apollo/react-hooks';
import useAuth from '@jetshop/core/components/AuthContext/useAuth';

import * as resolver from '../resolvers';

export function useVoyadoLookup(options: Partial<LookupContext>) {
  const client = useApolloClient();
  const { logIn } = useAuth();
  const [state, send] = useMachine(LookupMachine, {
    services: {
      externalLookup: (_, event: LookupEvents) => {
        return resolver.externalLookup(event, {
          client,
        });
      },
      activateExternalId: (context: LookupContext) => {
        return resolver.activateExternalId(context, {
          client,
        });
      },
      personLookup: (context: LookupContext) => {
        return resolver.personLookup(context, {
          client,
        });
      },
      login: (context: LookupContext) => Promise.resolve(logIn(context.customer.token)),
    },
    context: {
      customer: null,
      lookupOptions: {
        ...defaultLookupOptions,
        ...options,
      },
    },
  });

  const lookup = (key: string) => {
    send({ type: 'DO_LOOKUP', data: { key } });
  };

  const activate = () => {
    send({ type: 'ACTIVATE_CUSTOMER' });
  };

  const retryLookup = () => {
    send({ type: 'RETRY' });
  };

  // Surface API responses.
  const states = {
    isActivationRequired: state.matches('lookup.lookup_success.activation.activation_required'),
    isActivationPending: state.matches('lookup.lookup_success.activation.activation_loading'),
    isActivationSuccess: state.matches(
      'lookup.lookup_success.activation.activation_success.customer_created'
    ),
    isPreExistingCustomer: state.matches('lookup.lookup_success.preexisting'),
    IsAdditionalDataRequired: state.matches('lookup.lookup_success.additional_data'),
    isNonExistingCustomer: state.matches('lookup.lookup_success.non_existing'),
    isPersonLookupPending: state.matches(
      'lookup.lookup_success.non_existing.person_lookup_loading'
    ),
    hasPersonLookupData: state.matches('lookup.lookup_success.non_existing.person_lookup_success'),
    error: {
      lookupError: state.matches('lookup.lookup_failed'),
      activationError: state.matches('lookup.lookup_success.activation.activation_failed'),
      errorMessage: state.context.activationError,
    },
  };

  console.log('VoyadoLookupState: ', JSON.stringify(state.value));
  console.log('VoyadoLookupState: ', state.context);

  return {
    lookup,
    activate,
    retryLookup,
    ...states,
    customer: state.context.customer,
  };
}
