import { Machine, assign, send } from 'xstate';


interface ExternalLookupContext {
  data: any
};

interface ExternalLookupSchema {
  states: {
    IDLE: {}
    DO_LOOKUP: {}
    LOOKUP_SUCCESS: {}
    LOOKUP_FAILED: {}
  }
};

interface Success {
  states: {
    SUCCESS: {}
  }
}

/**

        ACTIVATION_REQUIRED: {}
        PREEXISTING_CUSTOMER: {}
        ADDITIONAL_USER_DATA_REQUIRED: {}
        NON_EXISTING_CUSTOMER: {}

 */

type LookupEvents =
  | { type: 'LOOKUP', data: { key?: string } }
  | { type: 'ACTIVATION_REQUIRED', data?: any }
  | { type: 'PREEXISTING_CUSTOMER', data?: any }
  | { type: 'ADDITIONAL_USER_DATA_REQUIRED', data?: any }
  | { type: 'NON_EXISTING_CUSTOMER', data?: any }

const sendLookupEvent =
  send((_: ExternalLookupContext, event: LookupEvents) => ({
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup
  }))

export const ExternalLookupMachine = Machine<ExternalLookupContext, ExternalLookupSchema, LookupEvents>({
  id: 'ExternalLookupMachine',
  initial: 'IDLE',
  context: {
    data: null
  },
  states: {
    IDLE: {
      on: {
        LOOKUP: 'DO_LOOKUP'
      }
    },
    DO_LOOKUP: {
      invoke: {
        id: 'INVOKE_LOOKUP',
        src: 'doExternalLookup',
        onDone: {
          target: 'LOOKUP_SUCCESS',
          actions: 'sendLookupEvent'
        },
        onError: 'LOOKUP_FAILED'
      }
    },
    LOOKUP_SUCCESS: {
      on: {
        ACTIVATION_REQUIRED: {}, // CALL ACTIVATEEXTERNALCUSTOMERBYID
        PREEXISTING_CUSTOMER: {}, // SEND TO LOGIN
        ADDITIONAL_USER_DATA_REQUIRED: {}, // PRE POPULATE SIGNUP FORM WITH NON ADDITIONAL DATA
        NON_EXISTING_CUSTOMER: {} // CALL PERSONLOOKUP, PRE POPULATE SIGNUP FORM
      },
    },
    LOOKUP_FAILED: {}
  }
}, {
  actions: {
    sendLookupEvent
  }
});