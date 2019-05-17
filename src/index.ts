import { Action, Config } from "./types"
// hold singleton in library
let CLIactions: Action[] = []

export const initStateMachine = (actions: Action[]) => {
  if (CLIactions.length) throw new Error("CLIactions not empty, are you calling initStateMachine twice?")
  CLIactions = actions
}

export const StateMachine = (action: Action, config: Config) => {
  if (CLIactions.length === 0) throw new Error("CLIactions empty, call initStateMachine first")
}

export const resolveConfigs = (configs: Config[]) => {
  // TODO: report noisily on name conflict/override?
  return configs.reduce((prev, cur) => ({ ...prev, ...cur }), {})
}
