import { useMachine } from '@xstate/react';
import { ExternalLookupMachine, LookupContext, LookupEvents } from './ExternalLookup'
import { useApolloClient } from '@apollo/react-hooks';
import { QueryResult, MutationResult } from '@apollo/react-common'
import { PersonLookup, ExternalCustomerResult, ActivateExternalCustomerByIdResult } from '@jetshop/core/types';

import ExternalLookupQuery from './ExternalLookupQuery.gql'
import ActivateExternalId from './ActivateExternalId.gql'
import LookupQuery from './LookupQuery.gql'

export function useVoyadoLookup(settings: Partial<LookupContext>) {
  const client = useApolloClient()

  const [state, send] = useMachine(ExternalLookupMachine, {
    services: {
      externalLookup,
      activateExternalId,
      personLookup
    },
    context: {
      ...settings,
      customer: null
    }
  })

  function externalLookup(_: any, event: LookupEvents) {
    return client.query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key }
    }).then(({ data }: { data: QueryResult<{ ExternalLookupQuery: ExternalCustomerResult }> }) => data)
  }

  function personLookup(context: LookupContext) {
    return client.query({
      query: LookupQuery,
      variables: { key: context.customer.email }
    }).then(({ data }: { data: QueryResult<{ LookupQuery: PersonLookup }> }) => data)
  }

  function activateExternalId(context: LookupContext) {
    return client.mutate({
      mutation: ActivateExternalId,
      variables: { input: { externalCustomerId: context.customer.externalId } }
    }).then(({ data }: { data: MutationResult<{ ActivateExternalId: ActivateExternalCustomerByIdResult }> }) => data)
  }

  const lookup = (key?: string) => {
    send({ type: 'DO_LOOKUP', data: { key } })
  }

  const activate = () => {
    send({ type: 'ACTIVATE_CUSTOMER' })
  }

  const retryLookup = () => {
    send({ type: 'RETRY' })
  }

  const states = {
    isActivationRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION.ACTIVATION_REQUIRED'),
    isActivationPending: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION.ACTIVATION_LOADING'),
    isActivationSuccess: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION.ACTIVATION_SUCCESS'),
    isPreExistingCustomer: state.matches('LOOKUP.LOOKUP_SUCCESS.PREEXISTING'),
    IsAdditionalDataRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ADDITIONAL_DATA'),
    isNonExistingCustomer: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING'),
    isPersonLookupPending: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING.PERSON_LOOKUP_LOADING'),
    hasPersonLookupData: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING.PERSON_LOOKUP_SUCCESS'),
    activationError: {

    }
  }

  return { lookup, activate, retryLookup, ...states, customer: state.context.customer }
}
