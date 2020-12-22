import ApolloClient from 'apollo-client';
import { LookupContext, LookupEvents } from '../states/ExternalLookup';
import { VoyadoActivationContext } from '../states/GlobalActivation';
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
): Promise<any>;
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
