export declare const defaultContext: Partial<ExternalLookupContext>;
export interface ExternalLookupContext {
  customer: any;
  activateOnLookup: boolean;
}
interface ExternalLookupSchema {
  states: {
    IDLE: {};
    LOOKUP: {
      states: {
        LOOKUP_LOADING: {};
        LOOKUP_FAILED: {};
        LOOKUP_SUCCESS: {
          states: {
            STATUS_RESPONSE: {};
            ACTIVATION: {
              states: {
                ACTIVATION_REQUIRED: {};
                ACTIVATION_LOADING: {};
                ACTIVATION_SUCCESS: {};
                ACTIVATION_FAILED: {};
              };
            };
            ADDITIONAL_DATA: {};
            PREEXISTING: {};
            NON_EXISTING: {
              states: {
                NON_EXISTING_CUSTOMER: {};
                PERSON_LOOKUP_LOADING: {};
                PERSON_LOOKUP_SUCCESS: {};
                PERSON_LOOKUP_FAILED: {};
              };
            };
          };
        };
      };
    };
  };
}
declare type LookupEvents =
  | {
      type: 'DO_LOOKUP';
      data: {
        key?: string;
      };
    }
  | {
      type: 'ACTIVATION_REQUIRED';
      data: any;
    }
  | {
      type: 'PREEXISTING_CUSTOMER';
      data: any;
    }
  | {
      type: 'ADDITIONAL_USER_DATA_REQUIRED';
      data: any;
    }
  | {
      type: 'NON_EXISTING_CUSTOMER';
      data: any;
    }
  | {
      type: 'ACTIVATE_CUSTOMER';
      data?: any;
    }
  | {
      type: 'RETRY';
      data?: any;
    };
export declare const ExternalLookupMachine: import('xstate').StateMachine<
  ExternalLookupContext,
  ExternalLookupSchema,
  LookupEvents,
  {
    value: any;
    context: ExternalLookupContext;
  }
>;
export {};
