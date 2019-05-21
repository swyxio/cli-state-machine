# CLI State Machine

## High level Concepts

the state machine is based on `actions`, which are based on `states`, and `requirements`.

`Actions` consist of:

- `requiredStates`: before `execute`, required States for the Action to be valid
- `execute`: a function to execute once prereqs are valid
- `postExecuteState`: post `execute`, what State the action leads to.
- `failure`: an optional function to run if `postExecuteRequirements` doesnt get fulfiled after the action, probably due to developer forgetting to cover/catch some edge case but informs the user

`States` are defined by a list of `Requirements`.

`Requirements` have:

- `getter`s: a function that runs on the config and gets values to work with
- `assertion`s: a function that runs on the result of getters and returns a boolean.

We can run assertions on the requirements at any time. Users should try to get their data from `getters` instead of directly accessing so that they don't run into inconsistent states and fail.

check the comments on `src/types.ts` for more detailed info.

## TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
