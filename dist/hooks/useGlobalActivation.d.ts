import { VoyadoProviderOptions } from '../states/GlobalActivation';
export declare function useGlobalActivation(
  providerOptions: VoyadoProviderOptions
): {
  isAdditionalDataRequired: boolean;
  isNonExistingCustomer: boolean;
  isActivationRequired: boolean;
  isActionPending: boolean;
};
