import { Action, State } from '../../src/types'
import { initStateMachine, processStateMachine } from '../../src'
import { blankConfig } from '../../src/index'

let foo = 0

export const myState: State = {
  stateId: 'state1',
  description: 'state1 description',
  getValue: async () => foo,
  assert: async (gotten: number) => gotten === 0,
}
export const myAction: Action = {
  actionId: 'action1',
  beforeState: myState,
  execute: async () => {
    foo = 1
  },
}

export const randomOtherAction: Action = {
  actionId: 'action2',
  beforeState: myState,
  execute: async () => {
    foo = 1
  },
}

describe('basic action', () => {
  it("doesn't work if I fail to init", async () => {
    expect.assertions(1)
    await processStateMachine(myAction, blankConfig).catch(e =>
      expect(e).toEqual(new Error('CLIactions empty, call initStateMachine first'))
    )
  })
  it('works with numbers', async () => {
    expect.assertions(2)
    initStateMachine([myAction])
    expect(foo).toEqual(0)
    await processStateMachine(myAction, blankConfig)
    expect(foo).toEqual(1)
  })
})
