import { useMachine } from '@xstate/react';
import { LookupMachine, LookupContext, LookupEvents } from './ExternalLookup';
import { useApolloClient } from '@apollo/react-hooks';
import { QueryResult, MutationResult } from '@apollo/react-common';
import {
  PersonLookup,
  ExternalCustomerResult,
  ActivateExternalCustomerByIdResult,
} from '@jetshop/core/types';

import ExternalLookupQuery from './ExternalLookupQuery.gql';
import ActivateExternalId from './ActivateExternalId.gql';
import LookupQuery from './LookupQuery.gql';

export function useVoyadoLookup(settings: Partial<LookupContext>) {
  const client = useApolloClient();
  const [state, send] = useMachine(LookupMachine, {
    services: {
      externalLookup,
      activateExternalId,
      personLookup,
    },
    context: {
      ...settings,
      customer: null,
    },
  });

  function externalLookup(_: any, event: LookupEvents) {
    return client
      .query({
        query: ExternalLookupQuery,
        variables: { key: event.data.key },
      })
      .then(({ data }: { data: QueryResult<{ ExternalLookupQuery: ExternalCustomerResult }> }) => {
        return data;
      });
  }

  function personLookup(context: LookupContext) {
    return client
      .query({
        query: LookupQuery,
        variables: { key: context.customer.email },
      })
      .then(({ data }: { data: QueryResult<{ LookupQuery: PersonLookup }> }) => data);
  }

  function activateExternalId(context: LookupContext) {
    return client
      .mutate({
        mutation: ActivateExternalId,
        variables: {
          input: { externalCustomerId: context.customer.externalId },
        },
      })
      .then(
        ({
          data,
        }: {
          data: MutationResult<{
            ActivateExternalId: ActivateExternalCustomerByIdResult;
          }>;
        }) => data
      );
  }

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

  console.log(JSON.stringify(state.value));

  return {
    lookup,
    activate,
    retryLookup,
    ...states,
    customer: state.context.customer,
  };
}
