import { assign, Machine, send, DoneEventObject } from 'xstate';

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

type ActivationEvents =
  | { type: 'CHECKING_ACTION_REQUIRED'; data: any }
  | { type: 'NON_EXISTING_CUSTOMER'; data: any }
  | { type: 'ALREADY_ACTIVATED'; data: any }
  | { type: 'ACTIVATION_REQUIRED'; data: any }
  | { type: 'ADDITIONAL_DATA_REQUIRED'; data: any }
  | DoneEventObject;

type StateEventMapperIndex =
  | 'NoActionRequired' // Dummy
  | 'CustomerNotFound'
  | 'CustomerAlreadyActivated'
  | 'UnableToActivateCustomer'
  | 'UnableToLoginCustomer'
  | 'AdditionalUserDataRequired';

const StateEventMapper: { [key in StateEventMapperIndex]: string } = {
  NoActionRequired: 'NO_ACTION_REQUIRED',
  CustomerNotFound: 'NON_EXISTING_CUSTOMER',
  CustomerAlreadyActivated: 'ALREADY_ACTIVATED',
  AdditionalUserDataRequired: 'ADDITIONAL_DATA_REQUIRED',
  UnableToActivateCustomer: '',
  UnableToLoginCustomer: '',
};

const sendActionEvent = send((context: VoyadoActivationContext) => ({
  type: StateEventMapper[context.status],
}));

const setStatusReason = assign<VoyadoActivationContext, ActivationEvents>({
  status: (_, event: ActivationEvents) => {
    const [errorType] = event.data.error;
    return errorType.message || ('NoActionRequired' as StateEventMapperIndex);
  },
  customer: (_: any, event: ActivationEvents) => {
    if (event.data.activateExternalCustomerByToken) {
      return { ...event.data.activateExternalCustomerByToken.customer };
    } else {
      return undefined;
    }
  },
});

const storeCustomer = assign<VoyadoActivationContext, ActivationEvents>({
  customer: (context: VoyadoActivationContext, event: ActivationEvents) => {
    if (event.data?.externalCustomerLookup?.customer) {
      return {
        ...context.customer,
        ...event.data.externalCustomerLookup.customer,
        // Since there is a mismatch between SignupInput type and ExternalLookup type
        streetName: event.data.externalCustomerLookup.customer.address,
        mobilePhone: event.data.externalCustomerLookup.customer.mobilePhoneNumber,
      };
    } else {
      return {
        ...context.customer,
      };
    }
  },
});

export const createActivationMachine = (providerSettings: VoyadoProviderSettings) =>
  Machine<VoyadoActivationContext, ActivationSchema, ActivationEvents>(
    {
      id: 'ActivationMachine',
      initial: 'idle',
      context: {
        externalCustomerToken: '',
        customer: undefined,
        status: 'NoActionRequired',
        providerSettings: {
          ...providerSettings,
        },
      },
      states: {
        idle: {
          always: [
            {
              target: 'checking_action_required',
              cond: 'shouldInitialize',
            },
            {
              target: 'no_action_required',
            },
          ],
        },
        activated: {
          type: 'final',
        },
        checking_action_required: {
          invoke: {
            id: 'tryLogin',
            src: 'tryLogin',
            onDone: 'no_action_required',
            onError: 'action_required',
          },
        },
        no_action_required: {
          type: 'final',
        },
        action_required: {
          id: 'action_required',
          initial: 'try_activate',
          states: {
            try_activate: {
              invoke: {
                id: 'tryActivateByToken',
                src: 'tryActivateByToken',
                onDone: '#ActivationMachine.activated',
                onError: {
                  target: 'activation_failed',
                  actions: ['setStatusReason', 'sendActionEvent'],
                },
              },
            },
            activation_failed: {
              id: 'activation_failed',
              initial: 'status_response',
              states: {
                status_response: {
                  on: {
                    NON_EXISTING_CUSTOMER: 'non_existing',
                    ALREADY_ACTIVATED: 'already_activated',
                    ACTIVATION_REQUIRED: 'activation',
                    ADDITIONAL_DATA_REQUIRED: 'additional_data',
                    NO_ACTION_REQUIRED: 'non_existing',
                  },
                },
                non_existing: {
                  type: 'final',
                },
                already_activated: {},
                activation: {},
                additional_data: {
                  type: 'final',
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        setStatusReason,
        sendActionEvent,
        storeCustomer,
      },
    }
  );
