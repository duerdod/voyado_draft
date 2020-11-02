import { Machine } from 'xstate';

export interface VoyadoProviderSettings {
  isCoolCustomer: boolean;
}

interface VoyadoActivationContext {
  externalId: undefined | string;
  customer: any;
  providerSettings: VoyadoProviderSettings;
}

interface ActivationSchema {
  states: {
    IDLE: {};
    ACTIVATED: {};
    ACTIVATION_REQUIRED: {
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

export const createActivationMachine = (
  providerSettings: VoyadoProviderSettings
) =>
  Machine<VoyadoActivationContext, ActivationSchema>({
    id: 'ActivationMachine',
    initial: 'IDLE',
    context: {
      externalId: '',
      customer: undefined,
      providerSettings: {
        ...providerSettings,
      },
    },
    states: {
      IDLE: {},
      ACTIVATED: {
        type: 'final',
      },
      ACTIVATION_REQUIRED: {
        initial: 'STATUS_RESPONSE',
        states: {
          STATUS_RESPONSE: {
            on: {
              NON_EXISTING_CUSTOMER: {},
              ALREADY_ACTIVATED: {},
              ACTIVATION_REQUIRED: {},
              ADDITIONAL_DATA_REQUIRED: {},
            },
          },
          NON_EXISTING: {},
          ALREADY_ACTIVATED: {},
          ACTIVATION: {},
          ADDITIONAL_DATA: {},
        },
      },
      ACTIVATING_FAILED: {},
    },
  });
