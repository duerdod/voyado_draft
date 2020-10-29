import { Machine, assign, send } from 'xstate';

interface ActivationSchema {
  states: {
    IDLE: {}
    ACTIVATED: {}
    ACTIVATION_REQUIRED: {
      states: {
        ACTIVATING: {
          states: {
            STATUS_RESPONSE: {}
            NON_EXISTING_CUSTOMER: {}
            ALREADY_ACTIVATED: {}
            ACTIVATION_REQUIRED: {}
            ADDITIONAL_DATA_REQUIRED: {}
          }
        }
        ACTIVATING_FAILED: {}
      }
    }
  }
}