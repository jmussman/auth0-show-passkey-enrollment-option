/**
 * auth0-show-passkey-enrollment-option.js
 * Copyright © 2024 Joel A Mussman. All rights reserved.
 * 
 * This Action code is released under the MIT license and is free to copy and modify as
 * long as the source is attributed.
 * 
 * If the user has the passkeyOptIn attribute set to true in the user metadata, this
 * action will check for existing enrollment, and if not present trigger the opt-in
 * enrollment of a passkey before the user moves on.
 * 
 * To configure this a machine-to-machine application needs to be configured in the tenant
 * which will talk to the default 'Auth0 Management API' to make management API requests.
 * The roles required for this application to service this action are 'read:users' and
 * 'read:authentication_methods'. Store the domain and credentials in the Action
 * secrets: 'domain', 'clientId', and 'clientSecret'.
 * 
 * Add a secret value 'debug' of true to enable console logging, remove it to disable
 * console logging. Remember to force a deployment of the action if you change the
 * secret.
 * 
 * Add the 'auth0' Node.js dependency at the latest version (4.4.0 at this time).
 */
exports.onExecutePostLogin = async (event, api) => {

    const DEBUG = event.secrets.debug;

    if (event.connection.strategy === 'auth0' && event.user.user_metadata.passkeyOptIn) {

        DEBUG ? console.log(`User ${event.user.user_id} has passkey opt in enabled`) : null;

        try {

            // Set up the connection to the management API (act as the management API client).

            const ManagementClient = require('auth0').ManagementClient;

            const management = new ManagementClient({

                domain: event.secrets.domain,
                clientId: event.secrets.clientId,
                clientSecret: event.secrets.clientSecret,
            });

            // The user's authentication methods list is populated for passkeys and nothing else.

            DEBUG ? console.log(`Retrieving authentication methods for ${event.user.user_id}`) : null;

            const authenticationMethods = await management.users.getAuthenticationMethods({id: event.user.user_id});

            if (!authenticationMethods?.length) {
                            
                DEBUG ? console.log(`Triggering enroll with passkey for ${event.user.user_id}`) : null;
                
                await api.authentication.enrollWithAny([ { type: 'webauthn-platform' }, { type: 'webauthn-roaming' } ]);
            }
        }

        catch (e) {

            DEBUG ? console.log(e) : null;

            // Rethrow the exception so Auth0 handles it and the error shows up at that level.

            throw e
        }
    }
};