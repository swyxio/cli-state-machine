# CLI State Machine

## High level Concepts

the state machine is based on `actions`, which are based on `states`, and `requirements`.

`Actions` consist of:

- Prerequisite `states`: required for the Action to be valid
- `execute`: a function to execute once prereqs are valid
- Post `fulfilsRequirements`: an assertion of what `requirements` are fulfiled after the action
- `failure`: an optional function to run if `fulfilsRequirements` doesnt get fulfiled after the action, probably due to developer forgetting to cover/catch some edge case

`states` are defined by a list of `requirements`.

`requirements` have:

- `getter`s: a function that runs on the config and gets values to work with
- `assertion`s: a function that runs on the getters and returns a boolean.

check the comments on `src/types.ts` for more detailed info.

## TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
