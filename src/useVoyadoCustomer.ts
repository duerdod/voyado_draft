import { useMachine } from '@xstate/react';
import { ExternalLookupMachine, STATES } from './ExternalLookupMachine'
import { useApolloClient } from '@apollo/react-hooks';

import ExternalLookupQuery from './ExternalLookupQuery.gql'

export function useExternalCustomer() {
  const client = useApolloClient()
  function doExternalLookup(_, event) {
    return client.query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key }
    }).then(({ data }) => data)
  }

  return { doExternalLookup }
}

export function useVoyadoCustomer() {
  const { doExternalLookup } = useExternalCustomer()

  const [state, send] = useMachine(ExternalLookupMachine, {
    services: {
      doExternalLookup
    }
  })

  const lookup = (key?: string) => {
    send({ type: 'DO_LOOKUP', data: { key } })
  }

  const states = {
    isActivationRequired: state.matches(STATES.LOOKUP_SUCCESS.ACTIVATION_REQUIRED),
    isPreExisting: state.matches(STATES.LOOKUP_SUCCESS.PREEXISTING_CUSTOMER),
    isAdditionalDataRequired: state.matches(STATES.LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED),
    isNonExistingCustomer: state.matches(STATES.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER)
  }

  return { lookup, ...states }
}
