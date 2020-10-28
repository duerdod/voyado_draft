import { Machine, assign, send } from 'xstate';

export const STATES = {
  IDLE: 'IDLE',
  LOOKUP: {
    NODE_NAME: 'LOOKUP',
    LOOKUP_LOADING: 'LOOKUP_LOADING',
    LOOKUP_FAILED: 'LOOKUP_FAILED',
    LOOKUP_SUCCESS: {
      NODE_NAME: 'LOOKUP_SUCCESS',
      ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
      PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
      ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
      NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER',
    }
  },
  LOGIN: {
    NODE_NAME: 'LOGIN',
    LOADING: 'LOADING',
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE'
  }
}

const EVENTS = {
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
  ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
  NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER'
}

interface ExternalLookupContext {
  customer: any
};

interface ExternalLookupSchema {
  states: {
    IDLE: {}
    LOOKUP: {
      states: {
        LOOKUP_LOADING: {}
        LOOKUP_FAILED: {}
        LOOKUP_SUCCESS: {
          states: {
            ACTIVATION_REQUIRED: {}
            PREEXISTING_CUSTOMER: {}
            ADDITIONAL_USER_DATA_REQUIRED: {}
            NON_EXISTING_CUSTOMER: {}
          }
        }
      }
    }
    LOGIN: {
      states: {
        LOADING: {}
        SUCCESS: {}
        FAILURE: {}
      }
    }
  }
};

type LookupEvents =
  | { type: 'DO_LOOKUP', data: { key?: string } }
  | { type: 'ACTIVATION_REQUIRED', data: any }
  | { type: 'PREEXISTING_CUSTOMER', data: any }
  | { type: 'ADDITIONAL_USER_DATA_REQUIRED', data: any }
  | { type: 'NON_EXISTING_CUSTOMER', data: any }

const sendLookupSuccessEvent =
  send((_: ExternalLookupContext, event: LookupEvents) => ({
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup
  }));

const saveCustomer = assign<ExternalLookupContext, LookupEvents>({
  customer: (_, event) => ({ ...event.data.customer })
})

const saveToken = assign<ExternalLookupContext, LookupEvents>({
  customer: (context, event) => ({
    ...context.customer,
    token: event.data.activateExternalCustomerById.token.value
  })
})

const resetCustomer = assign<ExternalLookupContext, LookupEvents>({
  customer: () => null
})

export const ExternalLookupMachine = Machine<ExternalLookupContext, ExternalLookupSchema, LookupEvents>({
  id: 'ExternalLookupMachine',
  initial: 'IDLE',
  context: {
    customer: null
  },
  states: {
    IDLE: {
      on: {
        DO_LOOKUP: STATES.LOOKUP.NODE_NAME
      }
    },
    LOOKUP: {
      id: 'LOOKUP',
      initial: 'LOOKUP_LOADING',
      states: {
        LOOKUP_LOADING: {
          invoke: {
            id: 'invoke_lookup',
            src: 'externalLookup',
            onDone: {
              target: 'LOOKUP_SUCCESS',
              actions: 'sendLookupSuccessEvent'
            },
            onError: '#LOOKUP.LOOKUP_FAILED'
          },
        },
        LOOKUP_FAILED: {},
        LOOKUP_SUCCESS: {
          id: 'LOOKUP_SUCCESS',
          on: {
            [EVENTS.ACTIVATION_REQUIRED]: {
              target: 'LOOKUP_SUCCESS.ACTIVATION_REQUIRED',
              actions: 'saveCustomer'
            },
            [EVENTS.PREEXISTING_CUSTOMER]: 'LOOKUP_SUCCESS.PREEXISTING_CUSTOMER',
            [EVENTS.ADDITIONAL_USER_DATA_REQUIRED]: {},
            [EVENTS.NON_EXISTING_CUSTOMER]: {},
          },
          states: {
            // CALL ACTIVATEEXTERNALCUSTOMERBYID
            ACTIVATION_REQUIRED: {
              invoke: {
                id: 'invoke_activation',
                src: 'activateExternalId',
                onDone: {
                  actions: 'saveToken',
                  target: '#LOGIN'
                },
                onError: {
                  target: '#LOOKUP.LOOKUP_FAILED'
                }
              },
            },
            // REDIRECT TO LOGIN / CONDITIONALLY SHOW LOGIN FORM WITH STATE MATCHES
            PREEXISTING_CUSTOMER: {
              type: 'final'
            },
            // PRE POPULATE SIGNUP FORM WITH EXISTING DATA
            ADDITIONAL_USER_DATA_REQUIRED: {},
            // CALL PERSONLOOKUP -> PRE POPULATE SIGNUP FORM (TO BE CONTINUED)
            // REDIRECT TO SIGNUP
            NON_EXISTING_CUSTOMER: {
              type: 'final'
            },
          }
        }
      }
    },
    LOGIN: {
      id: 'LOGIN',
      initial: 'LOADING',
      states: {
        LOADING: {
          invoke: {
            id: 'invoke_login',
            src: 'login',
            onDone: {
              target: 'SUCCESS',
            },
            onError: {
              target: 'FAILURE',
              actions: 'resetCustomer'
            }
          }
        },
        SUCCESS: {
          type: 'final'
        },
        FAILURE: {
          always: {
            target: '#ExternalLookupMachine.IDLE'
          }
        }
      }
    }
  }
},
  {
    actions: {
      sendLookupSuccessEvent,
      saveCustomer,
      saveToken,
      resetCustomer
    }
  });