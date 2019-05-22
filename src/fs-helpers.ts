import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { Action, State } from './types'

export const createFolderExistsHelper = (
  /** folder name, no spaces allowed. slashes will create folder in folder. */
  folderName: string,
  options: {
    /** the path that the folder should exist in, default to process.cwd() */
    cwd: string
  } = { cwd: process.cwd() }
) => {
  // may want to put more validation on the folderName in future
  if (folderName.includes(' '))
    throw new Error(`folderName ${chalk.yellow(folderName)} cannot have a space in it`)
  const fullFolderPath = path.join(options.cwd, folderName)

  const folderMissingState: State<boolean> = {
    stateId: 'folderMissingState_' + folderName,
    getValue: async () => fs.existsSync(fullFolderPath),
    assert: async exists => exists === false,
  }
  const folderExistsState: State<boolean> = {
    stateId: 'folderExistsState_' + folderName,
    getValue: async () => fs.existsSync(fullFolderPath),
    assert: async exists => exists === true,
  }
  const folderExistsAction: Action = {
    actionId: 'folderExistsAction_' + folderName,
    beforeState: folderMissingState,
    afterState: folderExistsState,
    execute: async () => {
      fs.mkdirSync(fullFolderPath, { recursive: true })
    },
  }
  return {
    folderMissingState,
    folderExistsState,
    folderExistsAction,
  }
}
