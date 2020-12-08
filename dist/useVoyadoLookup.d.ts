import { LookupContext } from './ExternalLookup';
export declare function useVoyadoLookup(
  settings: Partial<LookupContext>
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
