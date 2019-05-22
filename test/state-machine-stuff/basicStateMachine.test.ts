import { Action, State } from '../../src/types'
import { initStateMachine, processStateMachine } from '../../src'
import { blankConfig } from '../../src/index'

let password = 'oldPassword'
let loginStatus = false

export const loggedInState: State = {
  stateId: 'loggedIn',
  getValue: async () => loginStatus,
  assert: async (status: boolean) => status === true,
}
export const loggedOutState: State = {
  stateId: 'loggedOut',
  getValue: async () => loginStatus,
  assert: async (status: boolean) => status === false,
}
export const loginAction: Action = {
  actionId: 'loginAction',
  beforeState: loggedOutState,
  afterState: loggedInState,
  execute: async () => {
    // console.log('logging in')
    loginStatus = true
  },
}
export const logoutAction: Action = {
  actionId: 'logoutAction',
  beforeState: loggedInState,
  afterState: loggedOutState,
  execute: async () => {
    // console.log('logging out')
    loginStatus = false
  },
}
export const changePasswordAction: Action = {
  actionId: 'changePassword',
  beforeState: loggedInState,
  afterState: loggedInState,
  execute: async () => {
    password = 'newPassword'
  },
}

describe('basic action', () => {
  it('self heals', async () => {
    initStateMachine([loginAction, logoutAction, changePasswordAction])
    expect(password).toEqual('oldPassword')
    expect(loginStatus).toEqual(false) // not logged in
    await processStateMachine(changePasswordAction, blankConfig)
    expect(password).toEqual('newPassword')
    expect(loginStatus).toEqual(true) // logged in
  })
})
