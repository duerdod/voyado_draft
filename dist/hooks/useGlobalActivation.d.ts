import { VoyadoProviderSettings } from '../states/GlobalActivation';
export declare function useGlobalActivation(
  providerSettings: VoyadoProviderSettings
): {
  isAdditionalDataRequired: boolean;
  isNonExistingCustomer: boolean;
  isActivationRequired: boolean;
  isActionPending: boolean;
};
