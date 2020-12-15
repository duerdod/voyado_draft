import { useMachine } from '@xstate/react';
import { LookupMachine, LookupContext, LookupEvents } from '../states/ExternalLookup';
import { useApolloClient } from '@apollo/react-hooks';

import * as resolver from '../resolvers';

export function useVoyadoLookup(settings: Partial<LookupContext>) {
  const client = useApolloClient();
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
    },
    context: {
      ...settings,
      customer: null,
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
    isActivationSuccess: state.matches('lookup.lookup_success.activation.activation_success'),
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

  return {
    lookup,
    activate,
    retryLookup,
    ...states,
    customer: state.context.customer,
  };
}
