import { Machine, assign, send } from 'xstate';

const EVENTS = {
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
  ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
  NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER',
}

const STATES = {
  ACTIVATION_REQUIRED: '#ACTIVATION',
  PREEXISTING_CUSTOMER: '#PREEXISTING',
  ADDITIONAL_USER_DATA_REQUIRED: '#ADDITIONAL_DATA',
  NON_EXISTING_CUSTOMER: '#NON_EXISTING',
}

export const defaultContext: Partial<ExternalLookupContext> = {
  activateOnLookup: false
}

export interface ExternalLookupContext {
  customer: any,
  activateOnLookup: boolean
};

export interface ExternalLookupSchema {
  states: {
    IDLE: {}
    LOOKUP: {
      states: {
        LOOKUP_LOADING: {}
        LOOKUP_FAILED: {}
        LOOKUP_SUCCESS: {
          states: {
            STATUS_RESPONSE: {}
            ACTIVATION: {
              states: {
                ACTIVATION_REQUIRED: {}
                ACTIVATION_LOADING: {}
                ACTIVATION_SUCCESS: {}
                ACTIVATION_FAILED: {}
              }
            }
            ADDITIONAL_DATA: {}
            PREEXISTING: {}
            NON_EXISTING: {
              states: {
                NON_EXISTING_CUSTOMER: {}
                PERSON_LOOKUP_LOADING: {}
                PERSON_LOOKUP_SUCCESS: {}
                PERSON_LOOKUP_FAILED: {}
              }
            }
          }
        }
      }
    }
  }
}

export type LookupEvents =
  | { type: 'DO_LOOKUP', data: { key?: string } }
  | { type: 'ACTIVATION_REQUIRED', data: any }
  | { type: 'PREEXISTING_CUSTOMER', data: any }
  | { type: 'ADDITIONAL_USER_DATA_REQUIRED', data: any }
  | { type: 'NON_EXISTING_CUSTOMER', data: any }
  | { type: 'ACTIVATE_CUSTOMER', data?: any }
  | { type: 'RETRY', data?: any }

const sendLookupSuccessEvent =
  send((_: any, event: LookupEvents) => ({
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup
  }))

const storeEmail = assign<ExternalLookupContext, LookupEvents>({
  customer: (context: ExternalLookupContext, event: LookupEvents) => ({
    ...context.customer,
    email: event.data.key
  })
})

const storeCustomer = assign<ExternalLookupContext, LookupEvents>({
  customer: (context: ExternalLookupContext, event: LookupEvents) => ({
    ...context.customer,
    ...event.data.externalCustomerLookup.customer
  })
})

const storeLookupData = assign<ExternalLookupContext, LookupEvents>({
  customer: (_: any, event: LookupEvents) => {
    if (event?.data?.personLookup) {
      return { ...event.data.personLookup }
    }
  }
})

const storeToken = assign<ExternalLookupContext, LookupEvents>({
  customer: (context: ExternalLookupContext, event: LookupEvents) => ({
    ...context.customer,
    token: event.data.activateExternalCustomerById.token.value
  })
})

export const ExternalLookupMachine = Machine<ExternalLookupContext, ExternalLookupSchema, LookupEvents>({
  id: 'ExternalLookup',
  initial: 'IDLE',
  context: {
    activateOnLookup: false,
    customer: null
  },
  states: {
    IDLE: {
      id: 'IDLE',
      on: {
        DO_LOOKUP: 'LOOKUP'
      }
    },
    LOOKUP: {
      entry: 'storeEmail',
      initial: 'LOOKUP_LOADING',
      states: {
        LOOKUP_LOADING: {
          invoke: {
            id: 'fetchLookupStatus',
            src: 'externalLookup',
            onDone: {
              target: 'LOOKUP_SUCCESS',
              actions: ['sendLookupSuccessEvent']
            },
            onError: 'LOOKUP_FAILED'
          }
        },
        LOOKUP_FAILED: {
          on: {
            RETRY: '#IDLE'
          }
        },
        LOOKUP_SUCCESS: {
          initial: 'STATUS_RESPONSE',
          entry: 'storeCustomer',
          states: {
            STATUS_RESPONSE: {
              on: {
                [EVENTS.ACTIVATION_REQUIRED]: STATES.ACTIVATION_REQUIRED,
                [EVENTS.PREEXISTING_CUSTOMER]: STATES.PREEXISTING_CUSTOMER,
                [EVENTS.ADDITIONAL_USER_DATA_REQUIRED]: STATES.ADDITIONAL_USER_DATA_REQUIRED,
                [EVENTS.NON_EXISTING_CUSTOMER]: STATES.NON_EXISTING_CUSTOMER
              },
            },
            // Account needs activation. Then can login.
            ACTIVATION: {
              id: 'ACTIVATION',
              initial: 'ACTIVATION_REQUIRED',
              states: {
                ACTIVATION_REQUIRED: {
                  always: {
                    target: 'ACTIVATION_LOADING',
                    cond: (c) => c.activateOnLookup
                  },
                  on: {
                    ACTIVATE_CUSTOMER: 'ACTIVATION_LOADING'
                  }
                },
                ACTIVATION_LOADING: {
                  invoke: {
                    id: 'activate-customer-by-externalid',
                    src: 'activateExternalId',
                    onDone: {
                      actions: 'storeToken',
                      target: 'ACTIVATION_SUCCESS'
                    },
                    onError: 'ACTIVATION_FAILED'
                  }
                },
                ACTIVATION_SUCCESS: {
                  type: 'final'
                },
                ACTIVATION_FAILED: {
                  on: {
                    RETRY: '#IDLE'
                  }
                }
              }
            },
            PREEXISTING: {
              // Can login.
              id: 'PREEXISTING',
              type: 'final'
            },
            ADDITIONAL_DATA: {
              // Need more data to actually create a customer.
              id: 'ADDITIONAL_DATA',
              type: 'final'
            },
            // Customer does not exist. Try fetch required information.
            NON_EXISTING: {
              id: 'NON_EXISTING',
              initial: 'NON_EXISTING_CUSTOMER',
              states: {
                NON_EXISTING_CUSTOMER: {
                  always: {
                    target: 'PERSON_LOOKUP_LOADING'
                  }
                },
                PERSON_LOOKUP_LOADING: {
                  invoke: {
                    id: 'fetch_person_lookupdata',
                    src: 'personLookup',
                    onDone: {
                      target: 'PERSON_LOOKUP_SUCCESS'
                    },
                    onError: 'PERSON_LOOKUP_FAILED'
                  },
                  exit: 'storeLookupData'
                },
                PERSON_LOOKUP_SUCCESS: {
                  type: 'final'
                },
                PERSON_LOOKUP_FAILED: {
                  type: 'final'
                }
              }
            },
          }
        },
      }
    }
  }
}, {
  actions: {
    sendLookupSuccessEvent,
    storeEmail,
    storeCustomer,
    storeToken,
    storeLookupData
  }
})