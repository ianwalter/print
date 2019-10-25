const { stripIndent } = require('common-tags')
const BaseError = require('@ianwalter/base-error')
const { print, chalk, md } = require('../..')

class ExampleError extends BaseError {}

print.write('No formatting on this one.')
print.error('Environment variables not set!')
print.error(new Error('No assertions were executed on that test.'))
print.error(new ExampleError(chalk.bold('Expected something else.')))
print.error('Timeout reached:', new ExampleError('promise cancelled'))
print.warn('File was overwritten:', '\n', '/tmp/fakeFile.json')
print.info('Done in 0.91s.')
print.debug('Flaky test started.', '\n', stripIndent`
  Make sure you check it out.
  Could be trouble.
`)
print.log('Request made to server.')
print.log('🔑', chalk.cyan('$2b$12$HMJFAblrhBCGxTWv5BnIFe'))
print.log(false, `export default () => {
  console.log('Hello World!')
}
`)
print.success('You did it!', 'Great job.')
print.debug('Total tests run:', 1)

const user = {
  id: 321,
  enabled: true,
  email: 'jack@river.com',
  details: {
    firstName: 'Jack',
    lastName: 'River',
    registered: new Date('2019-06-21T00:13:54.246Z'),
    address: {
      address: '1 Test St',
      apt: '201a',
      city: 'Red Hook',
      state: 'VI',
      phoneNumbers: [
        '617-555-5555',
        '860-555-5555'
      ]
    }
  },
  fullName () {
    return `${this.details.firstName} ${this.details.lastName}`
  }
}
user.boss = user
print.warn(new Error('User not found'), user)
print.md(
  'A new version is available **v1.1.0**!',
  'Run `yarn add widget@latest` to upgrade.'
)
print.success('Success!', md('**Donezo.**'))
print.fatal('This computer is dead.')
print.text('No emojis, homies')
