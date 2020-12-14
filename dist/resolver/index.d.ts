import ApolloClient from 'apollo-client';
import { MutationResult } from '@apollo/react-common/lib/types/types';
import { VoyadoActivationContext } from '../states/GlobalActivation';
import { LookupContext, LookupEvents } from '../states/ExternalLookup';
import { ActivateExternalCustomerByTokenResult } from '@jetshop/core/types';
declare function tryLogin(
  context: VoyadoActivationContext,
  options: {
    client: ApolloClient<any>;
    callback: (token: string) => void;
  }
): Promise<void>;
declare function tryActivateByToken(
  context: VoyadoActivationContext,
  options: {
    client: ApolloClient<any>;
    callback?: any;
  }
): Promise<
  MutationResult<{
    activateExternalCustomerByToken: ActivateExternalCustomerByTokenResult;
  }>
>;
declare function externalLookup(
  event: LookupEvents,
  options: {
    client: ApolloClient<any>;
  }
): Promise<any>;
declare function activateExternalId(
  context: LookupContext,
  options: {
    client: ApolloClient<any>;
  }
): Promise<any>;
declare function personLookup(
  context: LookupContext,
  options: {
    client: ApolloClient<any>;
  }
): Promise<any>;
export { tryLogin, tryActivateByToken, externalLookup, activateExternalId, personLookup };
