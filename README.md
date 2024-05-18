![Banner Light](./.assets/banner-auth0-show-passkey-enrollment-option-light.png#gh-light-mode-only)
![banner Dark](./.assets/banner-auth0-show-passkey-enrollment-option-dark.png#gh-dark-mode-only)

# Auth0-Show-Passkey-Enrollment-Option

## Overview

Customer identity cloud scenarios may benefit from passwordless and multi-factor authentication, but in CIC
the user needs to opt-in for this instead of having it forced upon them.
This action is designed to look for the opt-in and check to see if the user is not enrolled with passkeys,
and if not trigger enrollment during the login process.

This is one of a series of action examples that may be used as a foundation for building
what you need.
Search GitHub for *jmussman/auth0* to find other examples in the series.

## Implementation

The implementation looks at the user profile for a 'passkeyOptIn' attribute set to true in the user
metadata.
If the opt-in attribute is set, it checks the authentication methods for the user via the management API.
If passkeys are not set, it triggers passkey enrollment before the login flow proceeds.

Changing the opt-in attribute to false or removing it causes the action to skip the check for passkeys and
triggering enrollment.
The customer portal can clear the passkey registration if the user opts-out.
If the registration is not cleared, it will still work when the user clicks the passkey button
on the login screen, even if they are opted out.
This may be the desired behavior.

## Configuration

This assumes basic knowledge of working with actions and adding actions to flows in Auth0.
This is an overview of the configuration that must be established.

### Steps

1. Create or use an existing M2M application configuration that has read:users and read:authentication_methos permission in the Management API.
2. Create a new post-login action using the code in the *auth0-show-passkey-enrollment-option.js* file.
3. Add the *auth0* Node.js package as a dependency for the action, the current version at this time is 4.4.0.
4. Add secrets for *domain*, *clientId*, and *clientSecret* using the values from the application in step 1.
5. Add a secret *debug* with a value of true for console messages during testing, clear it for production. A re-deployment is neccessary after changing a secret.
6. Save and deploy the action in the post-login flow.

## License

The code is licensed under the MIT license. You may use and modify all or part of it as you choose, as long as attribution to the source is provided per the license. See the details in the [license file](./LICENSE.md) or at the [Open Source Initiative](https://opensource.org/licenses/MIT).


<hr>
Copyright © 2024 Joel A Mussman. All rights reserved.