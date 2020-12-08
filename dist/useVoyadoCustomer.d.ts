export declare function useExternalCustomer(): {
  externalLookup: (_: any, event: any) => any;
  activateExternalId: (context: any) => any;
  login: (context: any) => Promise<unknown>;
};
export declare function useVoyadoCustomer(): {
  customer: any;
  isActivationRequired: boolean;
  isPreExisting: boolean;
  isAdditionalDataRequired: boolean;
  isNonExistingCustomer: boolean;
  lookup: (key?: string | undefined) => void;
};
