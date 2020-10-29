import { Machine, assign, send } from 'xstate';

const EVENTS = {
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
  ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
  NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER'
}

export const defaultContext: Partial<ExternalLookupContext> = {
  activateOnLookup: false
}

export interface ExternalLookupContext {
  customer: any,
  activateOnLookup: boolean
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
            ACTIVATION_REQUIRED: {
              states: {
                ACTIVATING_CUSTOMER: {}
                CUSTOMER_ACTIVATED: {}
                FAILED_ACTIVATING_CUSTOMER: {}
              }
            }
            PREEXISTING_CUSTOMER: {}
            ADDITIONAL_USER_DATA_REQUIRED: {}
            NON_EXISTING_CUSTOMER: {
              states: {
                PERSON_LOOKUP_LOADING: {}
                PERSON_LOOKUP_SUCCESS: {}
                PERSON_LOOKUP_FAILED: {}
              }
            }
          }
        },
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
  | { type: 'ACTIVATE_CUSTOMER', data?: any }

const sendLookupSuccessEvent =
  send((_: ExternalLookupContext, event: LookupEvents) => ({
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup
  }));

const storeEmail = assign<ExternalLookupContext, LookupEvents>({
  customer: (context, event) => ({
    ...context.customer,
    email: event.data.key
  })
})

const storeCustomer = assign<ExternalLookupContext, LookupEvents>({
  customer: (context, event) => ({
    ...context.customer,
    ...event.data.customer
  })
})

const storeToken = assign<ExternalLookupContext, LookupEvents>({
  customer: (context, event) => ({
    ...context.customer,
    token: event.data.activateExternalCustomerById.token.value
  })
})

const resetCustomer = assign<ExternalLookupContext, LookupEvents>({
  customer: () => null
})

export const ExternalLookupMachine = Machine<ExternalLookupContext, ExternalLookupSchema, LookupEvents>({
  id: 'ExternalLookup',
  initial: 'IDLE',
  context: {
    customer: null,
    activateOnLookup: false
  },
  states: {
    IDLE: {
      on: {
        DO_LOOKUP: 'LOOKUP'
      }
    },
    LOOKUP: {
      id: 'LOOKUP',
      initial: 'LOOKUP_LOADING',
      states: {
        LOOKUP_LOADING: {
          entry: 'storeEmail',
          invoke: {
            id: 'invoke_lookup',
            src: 'externalLookup',
            onDone: {
              target: 'LOOKUP_SUCCESS',
              actions: ['sendLookupSuccessEvent']
            },
            onError: 'LOOKUP_FAILED'
          },
        },
        LOOKUP_FAILED: {
          entry: () => console.log('LOOKUP FAILED!!!')
        },
        LOOKUP_SUCCESS: {
          id: 'LOOKUP_SUCCESS',
          entry: 'storeCustomer',
          on: {
            [EVENTS.ACTIVATION_REQUIRED]: 'LOOKUP_SUCCESS.ACTIVATION_REQUIRED',
            [EVENTS.PREEXISTING_CUSTOMER]: 'LOOKUP_SUCCESS.PREEXISTING_CUSTOMER',
            [EVENTS.ADDITIONAL_USER_DATA_REQUIRED]: 'LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED',
            [EVENTS.NON_EXISTING_CUSTOMER]: 'LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER',
          },

          states: {
            // CALL ACTIVATEEXTERNALCUSTOMERBYID
            ACTIVATION_REQUIRED: {
              id: 'ACTIVATION_REQUIRED',
              always: {
                cond: (context) => false || context.activateOnLookup, // THIS IS MISSING ITS ORIGINAL TYPE, FOR SOME REASON.
                target: '#ACTIVATION_REQUIRED.ACTIVATING_CUSTOMER',
              },
              on: {
                ACTIVATE_CUSTOMER: '#ACTIVATION_REQUIRED.ACTIVATING_CUSTOMER'
              },
              states: {
                ACTIVATING_CUSTOMER: {
                  invoke: {
                    id: 'activateCustomer',
                    src: 'activateExternalId',
                    onDone: {
                      actions: 'storeToken',
                      target: 'CUSTOMER_ACTIVATED'
                    },
                    onError: {
                      target: 'FAILED_ACTIVATING_CUSTOMER'
                    }
                  },
                },
                CUSTOMER_ACTIVATED: {
                  type: 'final'
                },
                FAILED_ACTIVATING_CUSTOMER: {
                  always: '#ExternalLookup.IDLE'
                }
              }
            },
            // CAN LOGIN
            PREEXISTING_CUSTOMER: {
              type: 'final'
            },
            // NEEDS ADDITIONAL DATA TO LOGIN
            ADDITIONAL_USER_DATA_REQUIRED: {
              type: 'final'
            },
            // CALL PERSONLOOKUP
            NON_EXISTING_CUSTOMER: {
              initial: 'PERSON_LOOKUP_LOADING',
              states: {
                PERSON_LOOKUP_LOADING: {
                  invoke: {
                    id: 'person_lookup',
                    src: 'personLookup',
                    onDone: {
                      actions: 'storeLookupData',
                      target: 'PERSON_LOOKUP_SUCCESS'
                    },
                    onError: 'PERSON_LOOKUP_FAILED'
                  }
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
      },
    },
  }
},
  {
    actions: {
      sendLookupSuccessEvent,
      storeCustomer,
      storeToken,
      resetCustomer,
      storeEmail
    }
  });