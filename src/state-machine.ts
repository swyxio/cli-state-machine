import { Action, Config, State, ValidatedState } from './types'
import { Machine, StateMachine, DefaultContext, EventObject } from 'xstate'
import { getShortestPaths } from '@xstate/graph'
import chalk from 'chalk'
// hold singleton in library
let CLIactions: Action[] = []
let CLIStateMachine: StateMachine<DefaultContext, any, EventObject>
let log = console.log
let logError = console.error

// // cute little helper function to make sure users dont create actions with clashing names
// // maybe too sugary?
// export const createActions = (actionManifest: { [key: string]: Action }) => {
//   let newCLIactions: Action[] = []
//   Object.entries(actionManifest).map(([name, action]) => {
//     newCLIactions.push({
//       name,
//       ...action
//     })
//   })
//   return newCLIactions
// }

// must be run before any other code in CLI state machine
export const initStateMachine = (
  actions: Action[],
  options?: {
    logger?: typeof log
    errorLogger?: typeof logError
  }
) => {
  if (CLIactions.length)
    throw new Error('CLIactions not empty, are you calling initStateMachine twice?')
  CLIactions = actions
  if (options) {
    const { logger, errorLogger } = options
    if (logger) log = logger
    if (errorLogger) logError = errorLogger
  }
}

// the primary state machine to call with your action
export const processStateMachine = async <T = any>(
  action: Action<T>,
  config: Config,
  originalAction?: Action<T>
) => {
  if (CLIactions.length === 0) throw new Error('CLIactions empty, call initStateMachine first')
  const currentAction = CLIactions.find(a => a.actionId === action.actionId)
  if (!currentAction)
    throw new Error(`action ${chalk.yellow(action.actionId)} not found in initStateMachine list`)

  // // from old attempt with multiple preStates
  // let flatMappedStates: State[] = []
  // CLIactions.forEach(action => action.beforeState.forEach(state => flatMappedStates.push(state)))
  // const validatedStates = await validateStates(flatMappedStates, config)
  const validatedState = await validateState(action.beforeState, config)
  if (validatedState.isValid) {
    await action.execute(config, validatedState.value)
  } else {
    console.log(
      'DEBUG: some required states for this action were not valid, entering state machine'
    )
    // // some required states for this action were not valid
    // for (const state of validatedStates) {
    //   if (!state.isValid) continue
    //   // TODO: really need to make sure we generalize action.beforeState[0].stateId
    //   log(
    //     `need to fulfil ${chalk.yellow(action.beforeState[0].stateId)}, currently at ${chalk.yellow(
    //       state.stateId
    //     )}`
    //   )
    // }

    CLIStateMachine = Machine({
      ...constructStateMachine(CLIactions),
      initial: validatedState.stateId,
    })
    // TODO: think about nested graphs https://github.com/davidkpiano/xstate/issues/462
    const { path } = getShortestPaths(CLIStateMachine)[`"${validatedState.stateId}"`]
    for (const pathItem of path) {
      const {
        event: { type: actionId },
      } = pathItem
      const chosenAction = CLIactions.find(action => action.actionId === actionId)
      if (chosenAction) {
        log(`executing subaction ${chalk.yellow(chosenAction.actionId)} `)
        const _value = await chosenAction.beforeState.getValue(config)
        await chosenAction.execute(config, _value)
      } else {
        logError(
          `While healing, attempted to find ${chalk.yellow(
            actionId
          )} but couldnt. likely due to a malformed state machine`
        )
      }
    }
    // so we should have healed by now and can execute
    const _value = await action.beforeState.getValue(config)
    await action.execute(config, _value)
  }
  // after execution, optionally check if post execution requirements have been fulfiled
  if (action.afterState) {
    const { isValid, value } = await validateState(action.afterState, config)
    if (!isValid) {
      if (action.repeatable) {
        logError(
          `action ${action.actionId} executed, but these values don't pass the assertion criteria:`,
          value
        )
        logError(`TODO: execute the action again`)
      } else {
        // an action was executed but still doesnt fulfill afterState
        // this probably means the developer forgot to code something or cover an edge cases
        logError(
          `action ${action.actionId} executed, but these values don't pass the assertion criteria:`,
          value
        )
        logError(
          `Because this action has not been marked repeatable, we think this is due to developer error.`
        )
        // process.exit(1)
      }
    }
  }
  if (originalAction) log(`returning to ${originalAction.actionId}`)
}

export const blankConfig = {} as Config

export const resolveConfigs = (configs: Config[]) => {
  // TODO: report noisily on name conflict/override?
  return configs.reduce((prev, cur) => ({ ...prev, ...cur }), {})
}

////////////////////////////
/////// LOW LEVEL UTILS ////
////////////////////////////

// function allIsValid<T extends { isValid: boolean }>(arr: T[]) {
//   return arr.every(x => x.isValid)
// }

export const validateState = async <T = any>(
  state: State<T>,
  config: Config
): Promise<ValidatedState<T>> => {
  const value = await state.getValue(config)
  return state.assert(value).then(isValid => ({ ...state, value, isValid }))
}

/**
 * iterate through an array of states to check they are valid (by checking all *their* requirements are valid)
 *
 * return array of validatedStates that you can easily call `.every` on to check.
 * intentionally don't run `every` for you so you can iterate through
 */
export const validateStates = async <T = any>(
  states: State<T>[],
  config: Config
): Promise<ValidatedState<T>[]> => {
  return await Promise.all(states.map(state => validateState(state, config)))
}

// for state machine usage
type onType = { [key: string]: string }
type SMDict = { [key: string]: { on?: onType; type?: string } }
export const constructStateMachine = (actions: Action[]) => {
  const states: SMDict = { cliExitState: { type: 'final' } }
  // go through actions and get states and postExecReqs
  // go through each state and get reqs
  // TODO: detect repeat actions, e.g. throw new Error(`repeat action ${action.actionId} detected, terminating. please investigate.`)
  actions.forEach(({ afterState, beforeState, actionId }) => {
    const { stateId } = beforeState
    const preExistingOnKey = states[stateId] && states[stateId].on
    const on: onType = preExistingOnKey || {}
    if (afterState) {
      on[actionId] = afterState.stateId
    }
    if (!states[stateId]) states[stateId] = {}
    states[stateId].on = on
  })
  // console.log(states)
  // console.log(JSON.stringify({ states }, null, 2))
  return { id: 'cli-state-machine', states }
}
