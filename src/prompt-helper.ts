import chalk from 'chalk'
import { Action, State, Config } from './types'
import { prompt } from 'enquirer'

export const createRequiredFieldInConfig = (
  /** field name */
  fieldName: string,
  options: {
    /** message to the user to prompt for field */
    message?: string
    /** default reply if you have one to specify */
    initial?: string
  } = {}
) => {
  // may want to put more validation on the fieldName in future
  if (fieldName.includes(' '))
    throw new Error(`fieldName ${chalk.yellow(fieldName)} cannot have a space in it`)

  const fieldNameMissingState: State = {
    stateId: 'fieldNameMissingState_' + fieldName,
    value: async (config: Config) => config[fieldName],
    assert: async (field: any) => field === undefined,
  }
  const fieldNameExistsState: State = {
    stateId: 'fieldNameExistsState_' + fieldName,
    value: async (config: Config) => config[fieldName],
    assert: async (field: any) => field !== undefined,
  }
  const fieldNamePromptAction: Action = {
    actionId: 'fieldNamePromptAction_' + fieldName,
    preStates: [fieldNameMissingState],
    postState: fieldNameExistsState,
    execute: async config => {
      const question = {
        type: 'input',
        name: 'answer',
        message: options.message || `Enter ${chalk.yellow(fieldName)}: `,
        initial: options.initial,
      }
      const { answer } = await prompt(question)
      config[fieldName] = answer
    },
  }
  return {
    fieldNameMissingState,
    fieldNameExistsState,
    fieldNamePromptAction,
  }
}
