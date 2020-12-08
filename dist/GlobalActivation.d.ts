import { DoneEventObject } from 'xstate';
export interface VoyadoProviderSettings {
  loginPage?: string;
  signupPage?: string;
  loginOnActivation?: boolean;
}
export interface VoyadoActivationContext {
  externalCustomerToken: string;
  customer: any;
  status: StateEventMapperIndex;
  providerSettings: VoyadoProviderSettings;
}
interface ActivationSchema {
  states: {
    idle: {};
    activated: {};
    checking_action_required: {};
    no_action_required: {};
    action_required: {
      states: {
        try_activate: {};
        activation_failed: {
          states: {
            status_response: {};
            non_existing: {};
            already_activated: {};
            activation: {};
            additional_data: {};
          };
        };
      };
    };
  };
}
declare type ActivationEvents =
  | {
      type: 'CHECKING_ACTION_REQUIRED';
      data: any;
    }
  | {
      type: 'NON_EXISTING_CUSTOMER';
      data: any;
    }
  | {
      type: 'ALREADY_ACTIVATED';
      data: any;
    }
  | {
      type: 'ACTIVATION_REQUIRED';
      data: any;
    }
  | {
      type: 'ADDITIONAL_DATA_REQUIRED';
      data: any;
    }
  | DoneEventObject;
declare type StateEventMapperIndex =
  | 'NoActionRequired'
  | 'CustomerNotFound'
  | 'CustomerAlreadyActivated'
  | 'UnableToActivateCustomer'
  | 'UnableToLoginCustomer'
  | 'AdditionalUserDataRequired';
export declare const createActivationMachine: (
  providerSettings: VoyadoProviderSettings
) => import('xstate').StateMachine<
  VoyadoActivationContext,
  ActivationSchema,
  ActivationEvents,
  {
    value: any;
    context: VoyadoActivationContext;
  }
>;
export {};
