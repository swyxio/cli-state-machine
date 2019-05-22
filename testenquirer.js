const { prompt } = require('enquirer')

// const question = {
//   type: 'input',
//   name: 'username',
//   message: 'What is your username?'
// };

// const question = {
//   type: 'autocomplete',
//   name: 'country',
//   message: 'Where to?',
//   limit: 5,
//   suggest(input, choices) {
//     return choices.filter(choice => choice.message.startsWith(input))
//   },
//   choices: [
//     'Afghanistan',
//     'Albania',
//     'Algeria',
//     'Andorra',
//     'Angola',
//     'slkdj',
//     'dlkjqlkwj',
//     'kjekwjekwjekwj',
//     'wlqkjjjwlkwj',
//     'wlekjl2j2j2j3',
//     'lkwdj2',
//     '2l3kj2lk3j',
//   ],
// }
const question = {
  type: 'input',
  name: 'username',
  message: 'What is your username?',
  initial: 'helllo',
}
prompt(question)
  .then(answer => console.log('Answer:', answer))
  .catch(console.error)
