import { useMachine } from '@xstate/react';
import { ExternalLookupMachine, ExternalLookupContext, defaultContext } from './ExternalLookupMachine'
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
    }
  })

  function externalLookup(_, event) {
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


  const states = {
    isActivationRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION_REQUIRED'),
    isPreExisting: state.matches('LOOKUP.LOOKUP_SUCCESS.PREEXISTING_CUSTOMER'),
    isAdditionalDataRequired: state.matches('LOOKUP.LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED'),
    isNonExistingCustomer: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER'),
    isCustomerInActivation: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION_REQUIRED.ACTIVATING_CUSTOMER'),
    isCustomerActivated: state.matches('LOOKUP.LOOKUP_SUCCESS.ACTIVATION_REQUIRED.CUSTOMER_ACTIVATED'),
    isInPersonLookup: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER.PERSON_LOOKUP_LOADING'),
    hasPersonLookupData: state.matches('LOOKUP.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER.PERSON_LOOKUP_SUCCESS'),
  }

  console.log(states)

  return { lookup, activate, ...states, customer: state.context.customer }
}
