import * as core from '@actions/core'
import {handleEvent} from './utils'

const run = async (): Promise<void> => {
  try {
    await handleEvent()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
