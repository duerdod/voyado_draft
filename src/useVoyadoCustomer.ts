import { useMachine } from '@xstate/react';
import { ExternalLookupMachine } from './ExternalLookupMachine'
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
    console.log(context.customer)
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


  const states = {
    isActivationRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION_REQUIRED'),
    isPreExisting: state.matches('LOOKUP.LOOKUP_SUCCESS.PREEXISTING_CUSTOMER'),
    isAdditionalDataRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED'),
    isNonExistingCustomer: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER')
  }

  return { lookup, ...states, customer: state.context.customer }
}
