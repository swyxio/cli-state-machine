// for now, user is responsible for getting and providing all the configs
// in future we will handle fetching and caching
export type Config = {
  [key: string]: any
}

// for Requirements to get values
export type Getter<T = any> = (config: Config) => T
// States and actions can call Asserter with Getter output to check truthiness
export type Asserter<T = any> = (getterOutput: T) => Boolean

// a unitary requirement that the user defines
export type Requirement = AsyncRequirement | SyncRequirement
export type AsyncRequirement = {
  name: string
  description?: string
  getter: Promise<Getter>
  assert: Promise<Asserter>
}
export type SyncRequirement = {
  name: string
  description?: string
  getter: Getter
  assert: Asserter
}

// a state is just a "dumb" collection of requirements
export type State = {
  name?: string
  description?: string
  requirements: Requirement[]
}

/**
 * an Action is the primary unit of the state machine
 *
 * see field comments for what each does
 *  */
export type Action = {
  name?: string
  description?: string
  /** prerequisite states to check */
  prerequisiteStates: State[]
  /** the meat of the action to execute once */
  execute: <T = any>(arg: T) => {}
  /** the requirements that will be fulfilled after execute runs */
  fulfilsRequirements?: Requirement[]
  /** if requirements aren't fulfiled, what to do */
  failure?: Function
}
