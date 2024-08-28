// auth0-show-passkey-enrollment-option.test.js
// Copyright © 2024 Joel A Mussman. All rights reserved.
//
// This Action code is released under the MIT license and is free to copy and modify as
// long as the source is attributed.
//
// Note: EVERY test is limited to 20000ms (see the config), because Auth0 constrains actions to 20 seconds.
//

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import 'vitest-mock-commonjs'

import { onExecutePostLogin } from '../src/auth0-show-passkey-enrollment-option'

const mocks = vi.hoisted(() => {

    const gamResponse = {

        authenticationMethods: undefined
    }

    const managementClient = {

        users: {

            getAuthenticationMethods: vi.fn(async (requestParameters) => new Promise((resolve) => resolve(gamResponse.authenticationMethods)))
        }
    }

    class ManagementClient {

        constructor(options) {

            this.users = managementClient.users
        }
    }

    const mocks = {

        apiMock: {

            authentication: {

                enrollWithAny: vi.fn(() => {})
            }
        },

        auth0Mock: {
            
            ManagementClient: ManagementClient,
            managementClient: managementClient,
            gamResponse: gamResponse
        },

        eventMock: {

            connection: {

                strategy: 'auth0'
            },

            secrets: {

                clientId: 'abc',
                clientSecret: 'xyz',
                debug: true,
                domain: 'pid.pyrates.live'
            },

            user: {

                email: 'calicojack@pyrates.live',
                user_id: 'auth0|5f7c8ec7c33c6c004bbafe82',
                username: null,
                user_metadata: {
                    passkeyOptIn: true
                }
            }
        },
    }

    return mocks;
})

describe('Action tests', async () => {

    let consoleLogMock
    let ctor

    beforeAll(async () => {

        consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.mockForNodeRequire('auth0', mocks.auth0Mock)
    })

    beforeEach(() => {

        consoleLogMock.mockClear()
        mocks.apiMock.authentication.enrollWithAny.mockClear()
        mocks.auth0Mock.managementClient.users.getAuthenticationMethods.mockClear()
        ctor = vi.spyOn(mocks.auth0Mock, 'ManagementClient').mockImplementation(() => { return { users: mocks.auth0Mock.managementClient.users }})
    })

    it('Ignores enrollment if strategy is undefined', async () => {

        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.eventMock.secrets.debug = true

        delete mocks.eventMock.connection.strategy

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores enrollment if strategy is null', async () => {

        mocks.eventMock.connection.strategy = null
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.eventMock.secrets.debug = true

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores enrollment if strategy is not auth0', async () => {

        mocks.eventMock.connection.strategy = 'google-oauth'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.eventMock.secrets.debug = true

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores enrollment if user_metadata.passkeyOptIn is undefined', async () => {

        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.secrets.debug = true

        delete mocks.eventMock.user.user_metadata.passkeyOptIn

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores enrollment if user_metadata.passkeyOptIn is null', async () => {

        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = null
        mocks.eventMock.secrets.debug = true

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores enrollment if user_metadata.passkeyOptIn is not true', async () => {

        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = 0
        mocks.eventMock.secrets.debug = true

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Passes domain, clientID, and clientSecret to initialize managementClient', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = true

        const expectedOptions = {

            clientId: mocks.eventMock.secrets.clientId,
            clientSecret: mocks.eventMock.secrets.clientSecret,
            domain: mocks.eventMock.secrets.domain
        }

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).toHaveBeenCalledWith(expectedOptions)
    })

    it('Passes the correct user id to getAuthenticationMethods', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.eventMock.secrets.debug = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined

        const expectedOptions = {

            id: mocks.eventMock.user.user_id
        }

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.getAuthenticationMethods).toHaveBeenCalledWith(expectedOptions)
    })

    it('Does not trigger enrollment not proceed if authenticationMethods is set', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = [ { } ] // content is meaningless
        mocks.eventMock.secrets.debug = true

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.apiMock.authentication.enrollWithAny).not.toHaveBeenCalled()
    })

    it('Triggers enrollment if authenticationMethods is undefined', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = true

        const expectedOptions = [ { type: 'webauthn-platform' }, { type: 'webauthn-roaming' } ] // gray-box test, but we'll catch it if somebody alters the code.

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.apiMock.authentication.enrollWithAny).toHaveBeenCalledWith(expectedOptions)
    })

    it('Triggers enrollment if authenticationMethods is an empty array', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = [ ]
        mocks.eventMock.secrets.debug = true

        const expectedOptions = [ { type: 'webauthn-platform' }, { type: 'webauthn-roaming' } ] // gray-box test, but we'll catch it if somebody alters the code.

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.apiMock.authentication.enrollWithAny).toHaveBeenCalledWith(expectedOptions)
    })

    it ('Enroll emits debugging messages to the console if event.secrets.debug is true', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.eventMock.secrets.debug = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).toHaveBeenCalled()
    })

    it ('Does not emit debugging messages to the console if event.secrets.debug is undefined', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
       
        delete mocks.eventMock.secrets.debug

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it ('Does not emit debugging messages to the console if event.secrets.debug is null', async () => {
           
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = null

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it ('Does not emit debugging messages to the console if event.secrets.debug is false', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = false

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it ('Does not emit debugging messages to the console if event.secrets.debug is 0', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true      
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = 0

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Catches exception thrown and logs it during ManagementClient instantiation', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = true
       
        // Redefine the ManagementClient constructor to throw an exception.

        const message = 'This message should be logged'
        const ctor = vi.spyOn(mocks.auth0Mock, 'ManagementClient').mockImplementation(() => { throw message })

        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining(message))

        ctor.mockRestore()
    })

    it('Catches exception thrown and logs it for ManagementClient instantiation when debug is off', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined

        const message = 'This message should be logged'

        // Disable logging and redefine the API deny call to throw an exception.

        mocks.eventMock.secrets.debug = false
        mocks.apiMock.authentication.enrollWithAny = vi.fn(() => { throw message})
 
        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Catches exception thrown and logs it during API calls', async () => {
        
        mocks.eventMock.connection.strategy = 'auth0'
        mocks.eventMock.user.user_metadata.passkeyOptIn = true
        mocks.auth0Mock.gamResponse.authenticationMethods = undefined
        mocks.eventMock.secrets.debug = true

        // Redefine the API deny call to throw an exception.

        const message = 'This message should be logged'

        mocks.apiMock.authentication.enrollWithAny = vi.fn(() => { throw message })
 
        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
    })
})