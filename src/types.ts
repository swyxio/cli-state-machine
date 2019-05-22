// for now, user is responsible for getting and providing all the configs
// in future we will handle fetching and caching
export type Config = {
  [key: string]: any
}

// a state is just a "dumb" collection of requirements
export type ValidatedState<T = any> = State<T> & { value: T; isValid: boolean }
export type State<T = any> = {
  stateId: string
  description?: string
  /** retrieve a value for `assert` method, or for an `Action` to `execute` */
  getValue: (config: Config) => Promise<T>
  /** call `assert` on the result of getValue, and see if the state is valid or not */
  assert: (value: T) => Promise<boolean>
}

/**
 * an Action is the primary unit of the state machine
 *
 * see field comments for what each does
 *  */
export type Action<beforeStateType = any, afterStateType = any> = {
  actionId: string
  description?: string
  /** "BEFORE": prerequisite states to check */
  beforeState: State<beforeStateType>
  /** "DURING": the meat of the action to execute once */
  execute: (config: Config, value: beforeStateType) => Promise<void>
  /** "AFTER": a state that should be fulfilled after execute runs */
  afterState?: State<afterStateType>
  /** if postExcuteState isn't fulfilled, should we repeat this Action?
   *
   * make truthy to repeat executing until afterState is fulfiled
   * default falsy to blame the developer for afterState not being fulfiled */
  repeatable?: boolean
}
