import { useMachine } from '@xstate/react';
import { ExternalLookupMachine } from './ExternalLookupMachine'
import { useApolloClient } from '@apollo/react-hooks';


import ExternalLookupQuery from './ExternalLookupQuery.gql'

export function useVoyadoCustomer(): any {
  const client = useApolloClient()
  const [state, send] = useMachine(ExternalLookupMachine, {
    services: {
      doExternalLookup
    }
  })

  function doExternalLookup(_, event) {
    return client.query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key }
    }).then(({ data }) => data)
  }

  const lookup = (key?: string) => {
    send({ type: 'LOOKUP', data: { key } })
  }

  return lookup
}
