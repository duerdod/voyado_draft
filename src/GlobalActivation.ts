// @ts-nocheck

import { assign, Machine, send, DoneEventObject } from 'xstate';

export interface VoyadoProviderSettings {
  isCoolCustomer?: boolean;
  activated?: boolean;
}

export interface VoyadoActivationContext {
  externalCustomerToken: string;
  customer: any;
  status: StateEventMapperIndex;
  providerSettings: VoyadoProviderSettings;
}

interface ActivationSchema {
  states: {
    IDLE: {};
    ACTIVATED: {};
    CHECKING_ACTION_REQUIRED: {};
    NO_ACTION_REQUIRED: {};
    ACTION_REQUIRED: {
      states: {
        TRY_ACTIVATE: {};
        ACTIVATION_FAILED: {
          states: {
            STATUS_RESPONSE: {};
            NON_EXISTING: {};
            ALREADY_ACTIVATED: {};
            ACTIVATION: {};
            ADDITIONAL_DATA: {};
          };
        };
      };
    };
  };
}

type ActivationEvents =
  | { type: 'CHECK_ACTION_REQUIRED'; data: any }
  | { type: 'NON_EXISTING_CUSTOMER'; data: any }
  | { type: 'ALREADY_ACTIVATED'; data: any }
  | { type: 'ACTIVATION_REQUIRED'; data: any }
  | { type: 'ADDITIONAL_DATA_REQUIRED'; data: any }
  | DoneEventObject;

type StateEventMapperIndex =
  | ''
  | 'CustomerNotFound'
  | 'CustomerAlreadyActivated'
  | 'UnableToActivateCustomer'
  | 'UnableToLoginCustomer'
  | 'InvalidCustomerActivateInput'
  | 'AdditionalUserDataRequired';

const StateEventMapper: { [key in StateEventMapperIndex]: string } = {
  '': '',
  CustomerNotFound: 'NON_EXISTING_CUSTOMER',
  CustomerAlreadyActivated: '#ActivationMachine.ACTIVATED',
  AdditionalUserDataRequired: 'ADDITIONAL_DATA_REQUIRED',
  UnableToActivateCustomer: '',
  UnableToLoginCustomer: '',
  InvalidCustomerActivateInput: '',
};

const sendActionEvent = send(
  (context: VoyadoActivationContext) =>
    console.log(StateEventMapper[context.status]) || {
      type: StateEventMapper[context.status],
    }
);

const setStatusReason = assign<VoyadoActivationContext, ActivationEvents>({
  status: (_, event: ActivationEvents) => {
    const [errorType] = event.data.graphQLErrors;
    return errorType.message as StateEventMapperIndex;
  },
});

export const createActivationMachine = (providerSettings: VoyadoProviderSettings) =>
  Machine<VoyadoActivationContext, ActivationSchema, ActivationEvents>(
    {
      id: 'ActivationMachine',
      initial: 'IDLE',
      context: {
        externalCustomerToken: '',
        customer: undefined,
        status: '',
        providerSettings: {
          ...providerSettings,
        },
      },
      states: {
        IDLE: {
          always: [
            {
              target: 'CHECKING_ACTION_REQUIRED',
              cond: 'shouldInitialize',
            },
            {
              target: 'NO_ACTION_REQUIRED',
            },
          ],
        },
        ACTIVATED: {
          type: 'final',
        },
        CHECKING_ACTION_REQUIRED: {
          invoke: {
            id: 'tryLogin',
            src: 'tryLogin',
            onDone: 'NO_ACTION_REQUIRED',
            onError: 'ACTION_REQUIRED',
          },
        },
        NO_ACTION_REQUIRED: {
          type: 'final',
        },
        ACTION_REQUIRED: {
          initial: 'TRY_ACTIVATE',
          states: {
            TRY_ACTIVATE: {
              invoke: {
                id: 'tryActivateByToken',
                src: 'tryActivateByToken',
                onDone: '#ActivationMachine.ACTIVATED',
                onError: {
                  target: 'ACTIVATION_FAILED',
                  actions: ['setStatusReason', 'sendActionEvent'],
                },
              },
            },
            ACTIVATION_FAILED: {
              initial: 'STATUS_RESPONSE',
              states: {
                STATUS_RESPONSE: {
                  on: {
                    NON_EXISTING_CUSTOMER: 'NON_EXISTING',
                    ALREADY_ACTIVATED: 'ALREADY_ACTIVATED',
                    ACTIVATION_REQUIRED: 'ACTIVATION',
                    ADDITIONAL_DATA_REQUIRED: 'ADDITIONAL_DATA',
                  },
                },
                NON_EXISTING: {},
                ALREADY_ACTIVATED: {},
                ACTIVATION: {},
                ADDITIONAL_DATA: {},
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
      },
    }
  );
