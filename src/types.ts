// for now, user is responsible for getting and providing all the configs
// in future we will handle fetching and caching
export type Config = {
  [key: string]: any
}

// for Requirements to get values
export type Getter = (config: Config) => Promise<number | string | boolean>
// States and actions can call Asserter with Getter output to check truthiness
export type Asserter = (getterOutput: any) => Promise<Boolean>

// // failed attempt at making overloaded functions
// export function Asserter(getterOutput: string): Promise<Boolean>
// export function Asserter(getterOutput: number): Promise<Boolean>
// export async function Asserter() {
//   return false
// }

// a unitary requirement that the user defines
export type Requirement = AsyncRequirement // | SyncRequirement
export type ValidatedRequirement = Requirement & { isValid: boolean }
export type AsyncRequirement = {
  name: string
  description?: string
  getter: Getter
  assert: Asserter
}

// a state is just a "dumb" collection of requirements
export type ValidatedState = State & { isValid: boolean }
export type State = {
  uniqueName: string
  description?: string
  requirements: Requirement[]
}

/**
 * an Action is the primary unit of the state machine
 *
 * see field comments for what each does
 *  */
export type Action = {
  uniqueId: string
  description?: string
  /** "BEFORE": prerequisite states to check */
  requiredStates: State[]
  /** "DURING": the meat of the action to execute once */
  execute: (arg?: any) => Promise<void>
  /** "AFTER": a state that should be fulfilled after execute runs */
  postExecuteState?: State
  /** if requirements aren't fulfiled, what to do */
  failure?: Function
}

// /**
//  * a Healing Action is designed to explicitly take a state to another state
//  *
//  *  */
// export type HealingAction = {
//   uniqueId: string
//   description?: string
//   /** prerequisite state to check */
//   preState: State
//   /** the meat of the action to execute once */
//   execute: (arg?: any) => Promise<void>
//   /** the requirements that will be fulfilled after execute runs */
//   postExecuteRequirements?: Requirement[]
//   /** if requirements aren't fulfiled, what to do */
//   failure?: Function
// }
