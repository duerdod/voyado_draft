import React, { useEffect, createContext, useContext } from 'react';
import { Machine, send, assign } from 'xstate';
import { useMachine } from '@xstate/react';
import { useApolloClient } from '@apollo/react-hooks';
import useAuth from '@jetshop/core/components/AuthContext/useAuth';
import { useHistory, useLocation } from 'react-router';
import qs from 'qs';

function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return _extends.apply(this, arguments);
}

var defaultproviderOptions = {
  loginPath: '/login',
  signupPath: '/signup',
  loginOnActivation: true,
  manualActivation: false,
};
var StateEventMapper = {
  NoActionRequired: 'NO_ACTION_REQUIRED',
  CustomerNotFound: 'NON_EXISTING_CUSTOMER',
  CustomerAlreadyActivated: 'ALREADY_ACTIVATED',
  AdditionalUserDataRequired: 'ADDITIONAL_DATA_REQUIRED',
};
var sendActionEvent = /*#__PURE__*/ send(function(context) {
  return {
    type: StateEventMapper[context.status],
  };
});
var setStatusReason = /*#__PURE__*/ assign({
  status: function status(_, event) {
    var _event$data$error = event.data.error,
      errorType = _event$data$error[0];
    return errorType.message || 'NoActionRequired';
  },
  customer: function customer(_, event) {
    if (event.data.activateExternalCustomerByToken) {
      return _extends({}, event.data.activateExternalCustomerByToken.customer);
    } else {
      return undefined;
    }
  },
});
var storeCustomer = /*#__PURE__*/ assign({
  customer: function customer(context, event) {
    var _event$data, _event$data$externalC;

    if (
      (_event$data = event.data) === null || _event$data === void 0
        ? void 0
        : (_event$data$externalC = _event$data.externalCustomerLookup) === null ||
          _event$data$externalC === void 0
        ? void 0
        : _event$data$externalC.customer
    ) {
      return _extends({}, context.customer, {}, event.data.externalCustomerLookup.customer, {
        // Since there is a mismatch between SignupInput type and ExternalLookup type
        streetName: event.data.externalCustomerLookup.customer.address,
        mobilePhone: event.data.externalCustomerLookup.customer.mobilePhoneNumber,
      });
    } else {
      return _extends({}, context.customer);
    }
  },
});
var createActivationMachine = function createActivationMachine(providerOptions) {
  return Machine(
    {
      id: 'ActivationMachine',
      initial: 'idle',
      context: {
        externalCustomerToken: '',
        customer: undefined,
        status: 'NoActionRequired',
        providerOptions: _extends({}, defaultproviderOptions, {}, providerOptions),
      },
      states: {
        idle: {
          always: [
            {
              target: 'checking_action_required',
              cond: 'shouldInitialize',
            },
            {
              target: 'no_action_required',
            },
          ],
        },
        activated: {
          // Log in.
          always: [
            {
              target: 'checking_action_required',
              cond: function cond(context) {
                return context.providerOptions.loginOnActivation;
              },
            },
            {
              target: 'no_action_required',
            },
          ],
        },
        checking_action_required: {
          invoke: {
            id: 'tryLogin',
            src: 'tryLogin',
            onDone: 'no_action_required',
            onError: 'action_required',
          },
        },
        no_action_required: {
          type: 'final',
        },
        action_required: {
          id: 'action_required',
          initial: 'try_activate',
          states: {
            try_activate: {
              invoke: {
                id: 'tryActivateByToken',
                src: 'tryActivateByToken',
                onDone: {
                  target: '#ActivationMachine.activated',
                },
                onError: {
                  target: 'activation_failed',
                  actions: ['setStatusReason', 'sendActionEvent'],
                },
              },
            },
            activation_failed: {
              id: 'activation_failed',
              initial: 'status_response',
              states: {
                status_response: {
                  on: {
                    NON_EXISTING_CUSTOMER: 'non_existing',
                    ALREADY_ACTIVATED: 'already_activated',
                    ADDITIONAL_DATA_REQUIRED: 'additional_data',
                    NO_ACTION_REQUIRED: 'non_existing',
                  },
                },
                non_existing: {
                  type: 'final',
                },
                already_activated: {
                  type: 'final',
                },
                additional_data: {
                  type: 'final',
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        setStatusReason: setStatusReason,
        sendActionEvent: sendActionEvent,
        storeCustomer: storeCustomer,
      },
    }
  );
};

var ActivateExternalCustomerByToken = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ActivateExternalToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'ActivateExternalCustomerByTokenInput' },
            },
          },
          directives: [],
        },
      ],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activateExternalCustomerByToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'success' },
                  arguments: [],
                  directives: [],
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'customer' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalId' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firstName' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'email' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastName' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'address' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'postalCode' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'mobilePhoneNumber' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'city' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'co' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  loc: {
    start: 0,
    end: 649,
    source: {
      body:
        'mutation ActivateExternalToken($input: ActivateExternalCustomerByTokenInput!) {\n  activateExternalCustomerByToken(input: $input) {\n    success\n    customer {\n      externalId\n      firstName {\n        encrypted\n        masked\n      }\n      email {\n        encrypted\n        masked\n      }\n      lastName {\n        encrypted\n        masked\n      }\n      address {\n        encrypted\n        masked\n      }\n      postalCode {\n        encrypted\n        masked\n      }\n      mobilePhoneNumber {\n        encrypted\n        masked\n      }\n      city {\n        encrypted\n        masked\n      }\n      co {\n        encrypted\n        masked\n      }\n    }\n  }\n}\n',
      name: 'GraphQL request',
      locationOffset: { line: 1, column: 1 },
    },
  },
};
var ActivateExternalId = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ActivateExternalId' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'ActivateExternalCustomerByIdInput' },
            },
          },
          directives: [],
        },
      ],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activateExternalCustomerById' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'success' },
                  arguments: [],
                  directives: [],
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'token' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'value' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  loc: {
    start: 0,
    end: 170,
    source: {
      body:
        'mutation ActivateExternalId($input: ActivateExternalCustomerByIdInput!) {\n  activateExternalCustomerById(input: $input) {\n    success\n    token {\n      value\n    }\n  }\n}\n',
      name: 'GraphQL request',
      locationOffset: { line: 1, column: 1 },
    },
  },
};
var ExternalLookupQuery = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ExternalLookupQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'key' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
      ],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'externalCustomerLookup' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'key' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'key' } },
              },
            ],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'status' },
                  arguments: [],
                  directives: [],
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'customer' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalId' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firstName' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'email' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastName' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'address' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'postalCode' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'mobilePhoneNumber' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'city' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'co' },
                        arguments: [],
                        directives: [],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'encrypted' },
                              arguments: [],
                              directives: [],
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'masked' },
                              arguments: [],
                              directives: [],
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  loc: {
    start: 0,
    end: 598,
    source: {
      body:
        'query ExternalLookupQuery($key: String!) {\n  externalCustomerLookup(key: $key) {\n    status\n    customer {\n      externalId\n      firstName {\n        encrypted\n        masked\n      }\n      email {\n        encrypted\n        masked\n      }\n      lastName {\n        encrypted\n        masked\n      }\n      address {\n        encrypted\n        masked\n      }\n      postalCode {\n        encrypted\n        masked\n      }\n      mobilePhoneNumber {\n        encrypted\n        masked\n      }\n      city {\n        encrypted\n        masked\n      }\n      co {\n        encrypted\n        masked\n      }\n    }\n  }\n}\n',
      name: 'GraphQL request',
      locationOffset: { line: 1, column: 1 },
    },
  },
};
var LoginExternalCustomer = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'loginExternalCustomer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'LoginExternalCustomerInput' },
            },
          },
          directives: [],
        },
      ],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'loginExternalCustomer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'token' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'value' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  loc: {
    start: 0,
    end: 147,
    source: {
      body:
        'mutation loginExternalCustomer($input: LoginExternalCustomerInput!) {\n  loginExternalCustomer(input: $input) {\n    token {\n      value\n    }\n  }\n}\n',
      name: 'GraphQL request',
      locationOffset: { line: 1, column: 1 },
    },
  },
};
var LookupQuery = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LookupQuery' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'key' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
          directives: [],
        },
      ],
      directives: [],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'personLookup' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'key' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'key' } },
              },
            ],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firstName' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lastName' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'streetname' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'postalCode' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'mobilePhoneNumber' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'city' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'co' },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'encrypted' },
                        arguments: [],
                        directives: [],
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'masked' },
                        arguments: [],
                        directives: [],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  loc: {
    start: 0,
    end: 423,
    source: {
      body:
        'query LookupQuery($key: String!) {\n  personLookup(key: $key) {\n    firstName {\n      encrypted\n      masked\n    }\n    lastName {\n      encrypted\n      masked\n    }\n    streetname {\n      encrypted\n      masked\n    }\n    postalCode {\n      encrypted\n      masked\n    }\n    mobilePhoneNumber {\n      encrypted\n      masked\n    }\n    city {\n      encrypted\n      masked\n    }\n    co {\n      encrypted\n      masked\n    }\n  }\n}\n',
      name: 'GraphQL request',
      locationOffset: { line: 1, column: 1 },
    },
  },
}; // Semi login resolvers

function tryLogin(context, options) {
  var logIn = options.callback;
  return options.client
    .mutate({
      mutation: LoginExternalCustomer,
      variables: {
        input: {
          externalCustomerToken: context.externalCustomerToken,
        },
      },
    })
    .then(
      function(_ref) {
        var _data$loginExternalCu;

        var data = _ref.data;

        if (
          data === null || data === void 0
            ? void 0
            : (_data$loginExternalCu = data.loginExternalCustomer.token) === null ||
              _data$loginExternalCu === void 0
            ? void 0
            : _data$loginExternalCu.value
        ) {
          var _data$loginExternalCu2, _data$loginExternalCu3;

          return Promise.resolve(
            logIn(
              data === null || data === void 0
                ? void 0
                : (_data$loginExternalCu2 = data.loginExternalCustomer) === null ||
                  _data$loginExternalCu2 === void 0
                ? void 0
                : (_data$loginExternalCu3 = _data$loginExternalCu2.token) === null ||
                  _data$loginExternalCu3 === void 0
                ? void 0
                : _data$loginExternalCu3.value
            )
          );
        } else {
          return Promise.reject();
        }
      },
      function(error) {
        return Promise.reject(error);
      }
    );
}

function tryActivateByToken(context, options) {
  return (
    options.client
      .mutate({
        mutation: ActivateExternalCustomerByToken,
        variables: {
          input: {
            externalCustomerToken: context.externalCustomerToken,
          },
        },
        // This is needed because we're using both the error and data to decide the next event.
        errorPolicy: 'all',
      }) // Change this when API is returning a status like we do on external lookup.
      // If we got a status, we could just forward them as event.type.
      .then(function(_ref2) {
        var data = _ref2.data,
          errors = _ref2.errors;

        if (errors) {
          return Promise.reject(
            _extends(
              {
                error: _extends({}, errors),
              },
              data
            )
          );
        } else {
          return Promise.resolve(data);
        }
      })
  );
} // Lookup resolvers

function externalLookup(event, options) {
  return options.client
    .query({
      query: ExternalLookupQuery,
      variables: {
        key: event.data.key,
      },
    })
    .then(function(_ref3) {
      var data = _ref3.data;
      return data;
    });
}

function activateExternalId(context, options) {
  return options.client
    .mutate({
      mutation: ActivateExternalId,
      variables: {
        input: {
          externalCustomerId: context.customer.externalId,
        },
      },
    })
    .then(function(_ref4) {
      var data = _ref4.data;
      return data;
    });
}

function personLookup(context, options) {
  return options.client
    .query({
      query: LookupQuery,
      variables: {
        key: context.customer.emailAddress,
      },
    })
    .then(function(_ref5) {
      var data = _ref5.data;
      return data;
    });
}

function useGlobalActivation(providerOptions) {
  var history = useHistory();
  var client = useApolloClient();

  var _useLocation = useLocation(),
    search = _useLocation.search;

  var _useAuth = useAuth(),
    loggedIn = _useAuth.loggedIn,
    logIn = _useAuth.logIn;

  var _qs$parse = qs.parse(search, {
      ignoreQueryPrefix: true,
    }),
    _qs$parse$eclub = _qs$parse.eclub,
    eclub = _qs$parse$eclub === void 0 ? '' : _qs$parse$eclub;

  var _useMachine = useMachine(createActivationMachine(providerOptions), {
      context: {
        externalCustomerToken: encodeURIComponent(eclub),
      },
      services: {
        tryLogin: function tryLogin$1(context) {
          return tryLogin(context, {
            client: client,
            callback: logIn,
          });
        },
        tryActivateByToken: function tryActivateByToken$1(context) {
          return tryActivateByToken(context, {
            client: client,
          });
        },
      },
      guards: {
        shouldInitialize: function shouldInitialize() {
          return eclub.length > 0 && !loggedIn;
        },
      },
    }),
    state = _useMachine[0];

  console.log('GlobalActivationState: ', JSON.stringify(state.value));
  var states = {
    isAdditionalDataRequired: state.matches('action_required.activation_failed.additional_data'),
    isNonExistingCustomer: state.matches('action_required.activation_failed.non_existing'),
    isActivationRequired: state.matches('action_required.activation_failed.already_activated'),
    // The following might cause impossible states...
    isActionPending:
      state.matches('checking_action_required') ||
      state.matches('action_required.try_activate') ||
      state.matches('action_required.activation_failed.status_response'),
  };
  useEffect(
    function() {
      if (states.isAdditionalDataRequired) {
        history.push(providerOptions.signupPath || '/signup', {
          customer: _extends({}, state.context.customer),
        });
      }
    },
    [states.isAdditionalDataRequired]
  );
  return _extends({}, states);
}

var VoyadoContext = /*#__PURE__*/ createContext({});
var VoyadoProvider = function VoyadoProvider(props) {
  var activationValues = useGlobalActivation(_extends({}, props.options));
  return React.createElement(
    VoyadoContext.Provider,
    Object.assign(
      {
        value: activationValues,
      },
      props
    )
  );
};
function useGlobalActivationStatus() {
  var context = useContext(VoyadoContext);

  if (!context) {
    return Error('useGlobalActivationStatus cannot be used outside VoyadoProvider');
  }

  return context;
}

var _on;
var EVENTS = {
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
  PREEXISTING_CUSTOMER: 'PREEXISTING_CUSTOMER',
  ADDITIONAL_USER_DATA_REQUIRED: 'ADDITIONAL_USER_DATA_REQUIRED',
  NON_EXISTING_CUSTOMER: 'NON_EXISTING_CUSTOMER',
};
var defaultLookupOptions = {
  activateOnLookup: true,
  signInOnActivation: false,
};
var sendLookupSuccessEvent = /*#__PURE__*/ send(function(_, event) {
  return {
    type: event.data.externalCustomerLookup.status,
    data: event.data.externalCustomerLookup,
  };
});
var storeEmail = /*#__PURE__*/ assign({
  customer: function customer(context, event) {
    return _extends({}, context.customer, {
      emailAddress: {
        masked: event.data.key,
      },
    });
  },
});
var storeCustomer$1 = /*#__PURE__*/ assign({
  customer: function customer(context, event) {
    var _event$data, _event$data$externalC;

    if (
      (_event$data = event.data) === null || _event$data === void 0
        ? void 0
        : (_event$data$externalC = _event$data.externalCustomerLookup) === null ||
          _event$data$externalC === void 0
        ? void 0
        : _event$data$externalC.customer
    ) {
      return _extends({}, context.customer, {}, event.data.externalCustomerLookup.customer, {
        // Since there is a mismatch between SignupInput and ExternalLookup
        streetName: event.data.externalCustomerLookup.customer.address,
        mobilePhone: event.data.externalCustomerLookup.customer.mobilePhoneNumber,
      });
    } else {
      return _extends({}, context.customer);
    }
  },
});
var storeLookupData = /*#__PURE__*/ assign({
  customer: function customer(context, event) {
    var _event$data2;

    if (
      event === null || event === void 0
        ? void 0
        : (_event$data2 = event.data) === null || _event$data2 === void 0
        ? void 0
        : _event$data2.personLookup
    ) {
      return _extends({}, event.data.personLookup);
    } else {
      return _extends({}, context.customer);
    }
  },
});
var storeToken = /*#__PURE__*/ assign({
  customer: function customer(context, event) {
    return _extends({}, context.customer, {
      token: event.data.activateExternalCustomerById.token.value,
    });
  },
});
var setActivationError = /*#__PURE__*/ assign({
  activationError: function activationError(event) {
    return '';
  },
});
var LookupMachine = /*#__PURE__*/ Machine(
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
                on:
                  ((_on = {}),
                  (_on[EVENTS.ACTIVATION_REQUIRED] = '#activation'),
                  (_on[EVENTS.PREEXISTING_CUSTOMER] = '#preexisting'),
                  (_on[EVENTS.ADDITIONAL_USER_DATA_REQUIRED] = '#additional_data'),
                  (_on[EVENTS.NON_EXISTING_CUSTOMER] = '#non_existing'),
                  _on),
              },
              // Account needs activation.
              activation: {
                id: 'activation',
                initial: 'activation_required',
                states: {
                  activation_required: {
                    always: {
                      target: 'activation_loading',
                      cond: function cond(context) {
                        return context.lookupOptions.activateOnLookup;
                      },
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
                    id: 'activation_success',
                    initial: 'try_login',
                    states: {
                      try_login: {
                        always: [
                          {
                            target: 'login',
                            cond: function cond(context) {
                              return context.lookupOptions.signInOnActivation;
                            },
                          },
                          {
                            target: 'customer_created',
                          },
                        ],
                      },
                      login: {
                        invoke: {
                          id: 'login',
                          src: 'login',
                          onDone: 'customer_created',
                          onError: 'login_failed',
                        },
                      },
                      login_failed: {
                        type: 'final',
                      },
                      customer_created: {
                        type: 'final',
                      },
                    },
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
      sendLookupSuccessEvent: sendLookupSuccessEvent,
      setActivationError: setActivationError,
      storeEmail: storeEmail,
      storeCustomer: storeCustomer$1,
      storeToken: storeToken,
      storeLookupData: storeLookupData,
    },
  }
);

function useVoyadoLookup(options) {
  var client = useApolloClient();

  var _useAuth = useAuth(),
    logIn = _useAuth.logIn;

  var _useMachine = useMachine(LookupMachine, {
      services: {
        externalLookup: function externalLookup$1(_, event) {
          return externalLookup(event, {
            client: client,
          });
        },
        activateExternalId: function activateExternalId$1(context) {
          return activateExternalId(context, {
            client: client,
          });
        },
        personLookup: function personLookup$1(context) {
          return personLookup(context, {
            client: client,
          });
        },
        login: function login(context) {
          return Promise.resolve(logIn(context.customer.token));
        },
      },
      context: {
        customer: null,
        lookupOptions: _extends({}, defaultLookupOptions, {}, options),
      },
    }),
    state = _useMachine[0],
    send = _useMachine[1];

  var lookup = function lookup(key) {
    send({
      type: 'DO_LOOKUP',
      data: {
        key: key,
      },
    });
  };

  var activate = function activate() {
    send({
      type: 'ACTIVATE_CUSTOMER',
    });
  };

  var retryLookup = function retryLookup() {
    send({
      type: 'RETRY',
    });
  }; // Surface API responses.

  var states = {
    isActivationRequired: state.matches('lookup.lookup_success.activation.activation_required'),
    isActivationPending: state.matches('lookup.lookup_success.activation.activation_loading'),
    isActivationSuccess: state.matches(
      'lookup.lookup_success.activation.activation_success.customer_created'
    ),
    isPreExistingCustomer: state.matches('lookup.lookup_success.preexisting'),
    IsAdditionalDataRequired: state.matches('lookup.lookup_success.additional_data'),
    isNonExistingCustomer: state.matches('lookup.lookup_success.non_existing'),
    isPersonLookupPending: state.matches(
      'lookup.lookup_success.non_existing.person_lookup_loading'
    ),
    hasPersonLookupData: state.matches('lookup.lookup_success.non_existing.person_lookup_success'),
    error: {
      lookupError: state.matches('lookup.lookup_failed'),
      activationError: state.matches('lookup.lookup_success.activation.activation_failed'),
      errorMessage: state.context.activationError,
    },
  };
  console.log('VoyadoLookupState: ', JSON.stringify(state.value));
  return _extends(
    {
      lookup: lookup,
      activate: activate,
      retryLookup: retryLookup,
    },
    states,
    {
      customer: state.context.customer,
    }
  );
}

export {
  LookupMachine,
  VoyadoContext,
  VoyadoProvider,
  createActivationMachine,
  defaultLookupOptions,
  useGlobalActivation,
  useGlobalActivationStatus,
  useVoyadoLookup,
};
//# sourceMappingURL=flight-voyado.esm.js.map
