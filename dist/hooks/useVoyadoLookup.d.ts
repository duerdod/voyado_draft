import { LookupContext } from '../states/ExternalLookup';
export declare function useVoyadoLookup(
  options: Partial<LookupContext>
): {
  customer: any;
  isActivationRequired: boolean;
  isActivationPending: boolean;
  isActivationSuccess: boolean;
  isPreExistingCustomer: boolean;
  IsAdditionalDataRequired: boolean;
  isNonExistingCustomer: boolean;
  isPersonLookupPending: boolean;
  hasPersonLookupData: boolean;
  error: {
    lookupError: boolean;
    activationError: boolean;
    errorMessage: string | null;
  };
  lookup: (key: string) => void;
  activate: () => void;
  retryLookup: () => void;
};
