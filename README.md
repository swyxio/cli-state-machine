# CLI State Machine

## High level Concepts

the state machine is based on `actions`, which are based on `states`.

`Actions` consist of:

- `beforeState`: before `execute`, required State for the Action to be valid
- `execute`: a function to execute once prereqs are valid
- `afterState`: post `execute`, what State the action leads to.
- `repeatable`: if true, a boolean

`States` have:

- `getValue`s: a function that runs (optionally using the config) and gets values to work with
- `assert`s: a function that runs on the result of `getValue` and returns a boolean.

We can run assertions on the requirements at any time. Users should try to get their data from `getters` instead of directly accessing so that they don't run into inconsistent states and fail. You can run `validateState` and get back a `ValidatedState` with two extra fields: `value` and `isValid`, for easier coding without excessive execution.

check the comments on `src/types.ts` for more detailed info.

## TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).
