import { assign, Machine, send, DoneEventObject } from 'xstate';
import getErrorDetail from '@jetshop/core/helpers/getErrorDetail';

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
  | 'InvalidCustomerActivateInput';

const StateEventMapper: { [key in StateEventMapperIndex]: string } = {
  '': '',
  CustomerNotFound: 'NON_EXISTING_CUSTOMER',
  CustomerAlreadyActivated: '#ActivationMachine.ACTIVATED',
  UnableToActivateCustomer: '',
  UnableToLoginCustomer: '',
  InvalidCustomerActivateInput: '',
};

const sendActionEvent = send((context: VoyadoActivationContext) => ({
  type: StateEventMapper[context.status],
}));

const setStatusReason = assign<VoyadoActivationContext, ActivationEvents>({
  status: (_, event: ActivationEvents) => {
    const [type] = getErrorDetail(event.data)?.codes;
    console.log('errorType: ', type);
    return type as StateEventMapperIndex;
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

/**

interface ActivationSchema_ {
  states: {
    IDLE: {};
    CHECKING_ACTION_REQUIRED: {}
    ACTIVATED: {};
    CHECK_POSSIBLE_CUSTOMER: {
      states: {
        CHECKING_POSSIBLE_CUSTOMER: {};
      }
    };
    ACTION_REQUIRED: {
      states: {
        STATUS_RESPONSE: {};
        NON_EXISTING: {};
        ALREADY_ACTIVATED: {};
        ACTIVATION: {};
        ADDITIONAL_DATA: {};
      };
    };
    ACTIVATING_FAILED: {};
  };
}

       IDLE: {
      always: {
        target: 'ACTIVATED',
        cond: 'shouldInitialize'
      },
      on: {
        'CHECK_ACTION_REQUIRED': 'CHECKING_ACTION_REQUIRED'
      }
    },
    CHECKING_ACTION_REQUIRED: {
      invoke: {
        id: 'tryLogin',
        src: 'tryLogin',
        onDone: 'NO_ACTION_REQUIRED',
        onError: 'CHECK_POSSIBLE_CUSTOMER'
      }
    },
    ACTIVATED: {
      type: 'final',
    },
    CHECK_POSSIBLE_CUSTOMER: {
      initial: 'CHECKING_POSSIBLE_CUSTOMER',
      states: {
        CHECKING_POSSIBLE_CUSTOMER: {
          invoke: {
            id: 'tryActivateByToken',
            src: 'tryActivateByToken',
            onDone: '#ActivationMachine.ACTIVATED',
            onError: {
              target: '#ActivationMachine.ACTION_REQUIRED',
              actions: ['setStatusReason', 'sendActionEvent']
            },
          }
        },
      }
    },
    ACTION_REQUIRED: {
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
        NON_EXISTING: {
          type: 'final'
        },
        ALREADY_ACTIVATED: {},
        ACTIVATION: {},
        ADDITIONAL_DATA: {},
      },
    },
    ACTIVATING_FAILED: {},
 */
