import { Machine, assign, send } from 'xstate';

export const STATES = {
  IDLE: 'IDLE',
  LOOKUP: 'LOOKUP',
  LOOKUP_FAILED: 'LOOKUP_FAILED',
  LOOKUP_SUCCESS: {
    LOOKUP_SUCCESS: 'LOOKUP_SUCCESS',
    ACTIVATION_REQUIRED: 'LOOKUP_SUCCESS.ACTIVATION_REQUIRED',
    PREEXISTING_CUSTOMER: 'LOOKUP_SUCCESS.PREEXISTING_CUSTOMER',
    ADDITIONAL_USER_DATA_REQUIRED: 'LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED',
    NON_EXISTING_CUSTOMER: 'LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER',
  },
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
    LOOKUP: {}
    LOOKUP_SUCCESS: {
      states: {
        ACTIVATION_REQUIRED: {}
        PREEXISTING_CUSTOMER: {}
        ADDITIONAL_USER_DATA_REQUIRED: {}
        NON_EXISTING_CUSTOMER: {}
      }
    }
    LOOKUP_FAILED: {}
  }
};

type LookupEvents =
  | { type: 'DO_LOOKUP', data: { key?: string } }
  | { type: 'ACTIVATION_REQUIRED', data?: any }
  | { type: 'PREEXISTING_CUSTOMER', data?: any }
  | { type: 'ADDITIONAL_USER_DATA_REQUIRED', data?: any }
  | { type: 'NON_EXISTING_CUSTOMER', data?: any }

const sendLookupSuccessEvent =
  send((_: ExternalLookupContext, event: LookupEvents) => ({
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup
  }))

export const ExternalLookupMachine = Machine<ExternalLookupContext, ExternalLookupSchema, LookupEvents>({
  id: 'ExternalLookupMachine',
  initial: 'IDLE',
  context: {
    customer: null
  },
  states: {
    IDLE: {
      on: {
        DO_LOOKUP: 'LOOKUP'
      }
    },
    LOOKUP: {
      invoke: {
        id: 'INVOKE_LOOKUP',
        src: 'doExternalLookup',
        onDone: {
          target: 'LOOKUP_SUCCESS',
          actions: 'sendLookupSuccessEvent'
        },
        onError: 'LOOKUP_FAILED'
      }
    },
    LOOKUP_SUCCESS: {
      on: {

        [EVENTS.ACTIVATION_REQUIRED]: STATES.LOOKUP_SUCCESS.ACTIVATION_REQUIRED,
        [EVENTS.PREEXISTING_CUSTOMER]: STATES.LOOKUP_SUCCESS.PREEXISTING_CUSTOMER,
        [EVENTS.ADDITIONAL_USER_DATA_REQUIRED]: STATES.LOOKUP_SUCCESS.ADDITIONAL_USER_DATA_REQUIRED,
        [EVENTS.NON_EXISTING_CUSTOMER]: STATES.LOOKUP_SUCCESS.NON_EXISTING_CUSTOMER,
      },
      states: {
        // CALL ACTIVATEEXTERNALCUSTOMERBYID
        ACTIVATION_REQUIRED: {

        },
        // SEND TO LOGIN / CONDITIONALLY SHOW LOGIN FORM
        PREEXISTING_CUSTOMER: {
          type: 'final'
        },
        // PRE POPULATE SIGNUP FORM WITH NON ADDITIONAL DATA
        ADDITIONAL_USER_DATA_REQUIRED: {},
        // CALL PERSONLOOKUP, PRE POPULATE SIGNUP FORM
        NON_EXISTING_CUSTOMER: {},
      }
    },
    LOOKUP_FAILED: {}
  }
}, {
  actions: {
    sendLookupSuccessEvent
  }
});