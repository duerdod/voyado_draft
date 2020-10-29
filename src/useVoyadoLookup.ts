import { useMachine } from '@xstate/react';
import { ExternalLookupMachine, ExternalLookupContext } from './ExternalLookupMachine'
import { useApolloClient } from '@apollo/react-hooks';

import ExternalLookupQuery from './ExternalLookupQuery.gql'
import ActivateExternalId from './ActivateExternalId.gql'
import LookupQuery from './LookupQuery.gql'

export function useVoyadoLookup(settings: Partial<ExternalLookupContext>) {
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
    },
    devTools: true
  })

  function externalLookup(_, event) {
    console.log(event)
    return client.query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key }
    }).then(({ data }) => data)
  }

  function personLookup(context) {
    return client.query({
      query: LookupQuery,
      variables: { key: context.customer.email }
    }).then(({ data }) => data)
  }

  function activateExternalId(context) {
    return client.mutate({
      mutation: ActivateExternalId,
      variables: { input: { externalCustomerId: context.customer.externalId } }
    }).then(({ data }) => data)
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
    IsAdditionalDataRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ADDITIONAL_DATA')
  }

  console.log(JSON.stringify(state.value))

  return { lookup, activate, retryLookup, ...states, customer: state.context.customer }
}
