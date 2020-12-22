import { DoneEventObject } from 'xstate';
export interface LookupContext {
  customer: any;
  activationError: null | string;
  lookupOptions: LookupOptions;
}
export declare const defaultLookupOptions: LookupOptions;
interface LookupOptions {
  activateOnLookup?: boolean;
  signInOnActivation?: boolean;
}
export interface LookupSchema {
  states: {
    idle: {};
    lookup: {
      states: {
        lookup_loading: {};
        lookup_failed: {};
        lookup_success: {
          states: {
            status_response: {};
            activation: {
              states: {
                activation_required: {};
                activation_loading: {};
                activation_success: {};
                activation_failed: {};
              };
            };
            additional_data: {};
            preexisting: {};
            non_existing: {
              states: {
                non_existing_customer: {};
                person_lookup_loading: {};
                person_lookup_success: {};
                person_lookup_failed: {};
              };
            };
          };
        };
      };
    };
  };
}
export declare type LookupEvents =
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
    }
  | DoneEventObject;
export declare const LookupMachine: import('xstate').StateMachine<
  LookupContext,
  LookupSchema,
  LookupEvents,
  {
    value: any;
    context: LookupContext;
  }
>;
export {};
