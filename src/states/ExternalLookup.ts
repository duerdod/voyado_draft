import { Machine, assign, send, DoneEventObject } from 'xstate';

const EVENTS = {
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
  ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
  NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER',
};

export interface LookupContext {
  customer: any;
  activationError: null | string;
  lookupOptions: LookupOptions;
}

export const defaultLookupOptions: LookupOptions = {
  activateOnLookup: true,
};

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

export type LookupEvents =
  | { type: 'DO_LOOKUP'; data: { key?: string } }
  | { type: 'ACTIVATION_REQUIRED'; data: any }
  | { type: 'PREEXISTING_CUSTOMER'; data: any }
  | { type: 'ADDITIONAL_USER_DATA_REQUIRED'; data: any }
  | { type: 'NON_EXISTING_CUSTOMER'; data: any }
  | { type: 'ACTIVATE_CUSTOMER'; data?: any }
  | { type: 'RETRY'; data?: any }
  | DoneEventObject;

const sendLookupSuccessEvent = send((_: any, event: LookupEvents) => ({
  type: event.data.externalCustomerLookup.status,
  data: event.data.externalCustomerLookup,
}));

const storeEmail = assign<LookupContext, LookupEvents>({
  customer: (context: LookupContext, event: LookupEvents) => ({
    ...context.customer,
    emailAddress: {
      masked: event.data.key,
    },
  }),
});

const storeCustomer = assign<LookupContext, LookupEvents>({
  customer: (context: LookupContext, event: LookupEvents) => {
    if (event.data?.externalCustomerLookup?.customer) {
      return {
        ...context.customer,
        ...event.data.externalCustomerLookup.customer,
        // Since there is a mismatch between SignupInput and ExternalLookup
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

const storeLookupData = assign<LookupContext, LookupEvents>({
  customer: (context: LookupContext, event: LookupEvents) => {
    if (event?.data?.personLookup) {
      return { ...event.data.personLookup };
    } else {
      return { ...context.customer };
    }
  },
});

const storeToken = assign<LookupContext, LookupEvents>({
  customer: (context: LookupContext, event: LookupEvents) => ({
    ...context.customer,
    token: event.data.activateExternalCustomerById.token.value,
  }),
});

const setActivationError = assign<LookupContext, LookupEvents>({
  activationError: () => '',
});

export const LookupMachine = Machine<LookupContext, LookupSchema, LookupEvents>(
  {
    id: 'LookupMachine',
    initial: 'idle',
    context: {
      activationError: null,
      customer: undefined,
      lookupOptions: {},
    },
    states: {
      idle: {
        id: 'idle',
        on: {
          DO_LOOKUP: 'lookup',
        },
      },
      lookup: {
        entry: 'storeEmail',
        initial: 'lookup_loading',
        states: {
          lookup_loading: {
            invoke: {
              id: 'fetchLookupStatus',
              src: 'externalLookup',
              onDone: {
                target: 'lookup_success',
                actions: ['sendLookupSuccessEvent'],
              },
              onError: 'lookup_failed',
            },
          },
          lookup_failed: {
            on: {
              RETRY: '#idle',
            },
          },
          lookup_success: {
            initial: 'status_response',
            entry: 'storeCustomer',
            states: {
              status_response: {
                on: {
                  [EVENTS.ACTIVATION_REQUIRED]: '#activation',
                  [EVENTS.PREEXISTING_CUSTOMER]: '#preexisting',
                  [EVENTS.ADDITIONAL_USER_DATA_REQUIRED]: '#additional_data',
                  [EVENTS.NON_EXISTING_CUSTOMER]: '#non_existing',
                },
              },
              // Account needs activation.
              activation: {
                id: 'activation',
                initial: 'activation_required',
                states: {
                  activation_required: {
                    always: {
                      target: 'activation_loading',
                      cond: (context: LookupContext) => context.lookupOptions.activateOnLookup!,
                    },
                    on: {
                      ACTIVATE_CUSTOMER: 'activation_loading',
                    },
                  },
                  activation_loading: {
                    invoke: {
                      id: 'activate-customer-by-externalid',
                      src: 'activateExternalId',
                      onDone: {
                        actions: 'storeToken',
                        target: 'activation_success',
                      },
                      onError: 'activation_failed',
                    },
                  },
                  activation_success: {
                    type: 'final',
                  },
                  activation_failed: {
                    entry: 'setActivationError',
                    on: {
                      RETRY: '#idle',
                    },
                  },
                },
              },
              preexisting: {
                // Can login.
                id: 'preexisting',
                type: 'final',
              },
              additional_data: {
                // Need more data to actually create a customer.
                id: 'additional_data',
                type: 'final',
              },
              // Customer does not exist. Try fetch required information.
              non_existing: {
                id: 'non_existing',
                initial: 'non_existing_customer',
                states: {
                  non_existing_customer: {
                    always: {
                      target: 'person_lookup_loading',
                    },
                  },
                  person_lookup_loading: {
                    invoke: {
                      id: 'fetch_person_lookupdata',
                      src: 'personLookup',
                      onDone: {
                        target: 'person_lookup_success',
                      },
                      onError: 'person_lookup_failed',
                    },
                    exit: 'storeLookupData',
                  },
                  person_lookup_success: {
                    type: 'final',
                  },
                  person_lookup_failed: {
                    type: 'final',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      sendLookupSuccessEvent,
      setActivationError,
      storeEmail,
      storeCustomer,
      storeToken,
      storeLookupData,
    },
  }
);
