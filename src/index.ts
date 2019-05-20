import { Action, Config, Requirement, ValidatedRequirement, State, ValidatedState } from "./types"
import { Machine, StateMachine, DefaultContext, EventObject } from "xstate"
import { getShortestPaths } from "@xstate/graph"
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
  if (CLIactions.length) throw new Error("CLIactions not empty, are you calling initStateMachine twice?")
  CLIactions = actions
  if (options) {
    const { logger, errorLogger } = options
    if (logger) log = logger
    if (errorLogger) logError = errorLogger
  }
}

// the primary state machine to call with your action
export const processStateMachine = async (action: Action, config: Config, originalAction?: Action) => {
  if (CLIactions.length === 0) throw new Error("CLIactions empty, call initStateMachine first")
  const currentAction = CLIactions.find((a) => a.uniqueId === action.uniqueId)
  if (!currentAction) throw new Error(`action ${action.uniqueId} not found in initStateMachine list`)

  let flatMappedStates: State[] = []
  CLIactions.forEach((action) => action.requiredStates.forEach((state) => flatMappedStates.push(state)))
  const validatedStates = await validateStates(flatMappedStates, config)
  if (allIsValid(validatedStates)) {
    await action.execute()
  } else {
    console.log("DEBUG: some required states for this action were not valid, entering state machine")
    // some required states for this action were not valid
    for (const state of validatedStates) {
      if (!state.isValid) continue
      // TODO: really need to make sure we generalize action.requiredStates[0].uniqueName
      log(`need to fulfil ${action.requiredStates[0].uniqueName}, currently at ${state.uniqueName}`)
      CLIStateMachine = Machine({
        ...constructStateMachine(CLIactions),
        initial: state.uniqueName
      })
      // TODO: fix indexing if xstate/graph api changes https://github.com/davidkpiano/xstate/issues/462
      const { path } = getShortestPaths(CLIStateMachine)[`"${action.requiredStates[0].uniqueName}"`]
      // const { path } = gsp[`"${state.uniqueName}"`]
      for (const pathItem of path) {
        const {
          event: { type: actionId }
        } = pathItem
        const chosenAction = CLIactions.find((action) => action.uniqueId === actionId)
        if (chosenAction) {
          log(`executing subaction ${chosenAction.uniqueId} `)
          await chosenAction.execute()
        } else {
          logError(`While healing, attempted to find ${actionId} but couldnt. likely due to a malformed state machine`)
        }
      }
      // so we should have healed by now and can execute
      // TODO: do we want to revalidate?
      await action.execute()
    }
  }
  // after execution, optionally check if post execution requirements have been fulfiled
  if (action.postExecuteState) {
    const validatedReqs = await validateRequirements(action.postExecuteState.requirements, config)
    if (!allIsValid(validatedReqs)) {
      // an action was executed but still doesnt fulfill its own specified postExecuteRequirements
      // this probably means the developer forgot to code something
      logError(`action ${action.uniqueId} executed, but still doesn't fulfil these requirements:`)
      for (const req of validatedReqs) {
        if (!req.isValid) logError(`- requirement ${req.name}`)
      }
      logError(`this is probably due to developer error.`)
      // process.exit(1)
    }
  }
  if (originalAction) log(`returning to ${originalAction.uniqueId}`)
}

export const blankConfig = {} as Config

export const resolveConfigs = (configs: Config[]) => {
  // TODO: report noisily on name conflict/override?
  return configs.reduce((prev, cur) => ({ ...prev, ...cur }), {})
}

////////////////////////////
/////// LOW LEVEL UTILS/////
////////////////////////////

function allIsValid<T extends { isValid: boolean }>(arr: T[]) {
  return arr.every((x) => x.isValid)
}

/**
 * iterate through an array of requirements to check they are valid (by calling .assert)
 *
 * return array of validatedRequirements that you can easily call `.every` on to check.
 * intentionally don't run `every` for you so you can iterate through
 */
const validateRequirements = async (reqs: Requirement[], config: Config) => {
  const validator = async (req: Requirement) => req.assert(await req.getter(config))
  return await Promise.all(reqs.map(async (req) => ({ ...req, isValid: await validator(req) } as ValidatedRequirement)))
}

/**
 * iterate through an array of states to check they are valid (by checking all *their* requirements are valid)
 *
 * return array of validatedStates that you can easily call `.every` on to check.
 * intentionally don't run `every` for you so you can iterate through
 */
const validateStates = async (states: State[], config: Config) => {
  const validator = async (state: State) =>
    validateRequirements(state.requirements, config).then((x: ValidatedRequirement[]) => x.every((req) => req.isValid))
  return await Promise.all(
    states.map(async (state) => ({ ...state, isValid: await validator(state) } as ValidatedState))
  )
}

// for state machine usage
type onType = { [key: string]: string }
type SMDict = { [key: string]: { on?: onType; type?: string } }
export const constructStateMachine = (actions: Action[]) => {
  const states: SMDict = { cliExitState: { type: "final" } }
  // go through actions and get states and postExecReqs
  // go through each state and get reqs
  // TODO: detect repeat actions, e.g. throw new Error(`repeat action ${action.uniqueId} detected, terminating. please investigate.`)
  actions.forEach(({ postExecuteState, requiredStates, uniqueId }) => {
    requiredStates.forEach(({ uniqueName }) => {
      const preExistingOnKey = states[uniqueName] && states[uniqueName].on
      const on: onType = preExistingOnKey || {}
      if (postExecuteState) {
        on[uniqueId] = postExecuteState.uniqueName
      }
      if (!states[uniqueName]) states[uniqueName] = {}
      states[uniqueName].on = on
    })
  })
  // console.log(states)
  // console.log(JSON.stringify({ states }, null, 2))
  return { id: "cli-state-machine", states }
}
