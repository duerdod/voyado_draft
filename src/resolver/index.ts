import ApolloClient from 'apollo-client';
import { LookupContext, LookupEvents } from '../states/ExternalLookup';
import { VoyadoActivationContext } from '../states/GlobalActivation';

import ActivateExternalCustomerByToken from '../queries/ActivateExternalCustomerByToken.gql';
import ActivateExternalId from '../queries/ActivateExternalId.gql';
import ExternalLookupQuery from '../queries/ExternalLookupQuery.gql';
import LoginExternalCustomer from '../queries/LoginExternalCustomer.gql';
import LookupQuery from '../queries/LookupQuery.gql';

// Semi login resolvers
function tryLogin(
  context: VoyadoActivationContext,
  options: {
    client: ApolloClient<any>;
    callback: (token: string) => void;
  }
) {
  const logIn = options.callback;
  return options.client
    .mutate({
      mutation: LoginExternalCustomer,
      variables: {
        input: {
          externalCustomerToken: context.externalCustomerToken,
        },
      },
    })
    .then(
      ({ data }) => {
        if (data?.loginExternalCustomer.token?.value) {
          return Promise.resolve(logIn(data?.loginExternalCustomer?.token?.value));
        } else {
          return Promise.reject();
        }
      },
      error => {
        return Promise.reject(error);
      }
    );
}

function tryActivateByToken(
  context: VoyadoActivationContext,
  options: {
    client: ApolloClient<any>;
    callback?: any;
  }
) {
  return (
    options.client
      .mutate({
        mutation: ActivateExternalCustomerByToken,
        variables: {
          input: { externalCustomerToken: context.externalCustomerToken },
        },
        // This is needed because we're using both the error and data to decide the next event.
        errorPolicy: 'all',
      })
      // Change this when API is returning a status like we do on external lookup.
      // If we got a status, we could just forward them as event.type.
      .then(({ data, errors }) => {
        if (errors) {
          return Promise.reject({ error: { ...errors }, ...data });
        } else {
          return Promise.resolve(data);
        }
      })
  );
}

// Lookup resolvers
function externalLookup(
  event: LookupEvents,
  options: {
    client: ApolloClient<any>;
  }
) {
  return options.client
    .query({
      query: ExternalLookupQuery,
      variables: { key: event.data.key },
    })
    .then(({ data }) => data);
}

function activateExternalId(
  context: LookupContext,
  options: {
    client: ApolloClient<any>;
  }
) {
  return options.client
    .mutate({
      mutation: ActivateExternalId,
      variables: {
        input: { externalCustomerId: context.customer.externalId },
      },
    })
    .then(({ data }) => data);
}

function personLookup(
  context: LookupContext,
  options: {
    client: ApolloClient<any>;
  }
) {
  return options.client
    .query({
      query: LookupQuery,
      variables: { key: context.customer.emailAddress },
    })
    .then(({ data }) => data);
}

export { tryLogin, tryActivateByToken, externalLookup, activateExternalId, personLookup };
