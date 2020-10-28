import { useMachine } from '@xstate/react';
import { ExternalLookupMachine, STATES } from './ExternalLookupMachine'
import { useApolloClient } from '@apollo/react-hooks';
import useAuth from '@jetshop/core/components/AuthContext/useAuth';

import ExternalLookupQuery from './ExternalLookupQuery.gql'
import ActivateExternalId from './ActivateExternalId.gql'

export function useExternalCustomer() {
  const client = useApolloClient()
  const { logIn } = useAuth()
  function externalLookup(_, event) {
    return client.query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key }
    }).then(({ data }) => data)
  }

  function activateExternalId(context) {
    return client.mutate({
      mutation: ActivateExternalId,
      variables: { input: { externalCustomerId: context.customer.externalId } }
    }).then(({ data }) => data)
  }

  function login(context) {
    return new Promise((resolve, reject) => {
      if (context.customer?.token) {
        logIn(context.customer.token)
        resolve()
      } else {
        reject()
      }
    })
  }

  return { externalLookup, activateExternalId, login }
}

export function useVoyadoCustomer() {
  const { externalLookup, activateExternalId, login } = useExternalCustomer()

  const [state, send] = useMachine(ExternalLookupMachine, {
    services: {
      externalLookup,
      activateExternalId,
      login
    }
  })

  const lookup = (key?: string) => {
    send({ type: 'DO_LOOKUP', data: { key } })
  }

  console.log('node', state.value)

  const states = {
    // isActivationRequired: state.matches(STATES.LOOKUP_SUCCESS.ACTIVATION_REQUIRED),
    // isPreExisting: state.matches(STATES.LOOKUP_SUCCESS.PREEXISTING_CUSTOMER),
    // isAdditionalDataRequired: state.matches(STATES.LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED),
    // isNonExistingCustomer: state.matches(STATES.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER)
  }

  return { lookup, ...states }
}
