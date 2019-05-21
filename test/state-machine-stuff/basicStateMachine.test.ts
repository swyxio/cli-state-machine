import { Action, State, Requirement } from '../../src/types'
import { initStateMachine, processStateMachine } from '../../src'
import { blankConfig } from '../../src/index'

let password = 'oldPassword'
let loginStatus = false

const loggedInRequirement: Requirement = {
  name: 'loggedIn',
  getter: async () => loginStatus,
  assert: async (status: boolean) => status === true,
}
const loggedOutRequirement: Requirement = {
  name: 'loggedOut',
  getter: async () => loginStatus,
  assert: async (status: boolean) => status === false,
}

export const loggedInState: State = {
  uniqueName: 'loggedIn',
  requirements: [loggedInRequirement],
}
export const loggedOutState: State = {
  uniqueName: 'loggedOut',
  requirements: [loggedOutRequirement],
}
export const loginAction: Action = {
  uniqueId: 'loginAction',
  requiredStates: [loggedOutState],
  postExecuteState: loggedInState,
  execute: async () => {
    loginStatus = true
  },
}
export const logoutAction: Action = {
  uniqueId: 'logoutAction',
  requiredStates: [loggedInState],
  postExecuteState: loggedOutState,
  execute: async () => {
    loginStatus = false
  },
}
export const changePasswordAction: Action = {
  uniqueId: 'changePassword',
  requiredStates: [loggedInState],
  postExecuteState: loggedInState,
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
