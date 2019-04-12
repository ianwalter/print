const { print, chalk } = require('../..')
const { stripIndent } = require('common-tags')

print.error('Environment variables not set!')
print.error(new Error('No assertions were executed on that test.'))
print.error(new Error(chalk.bold('Expected something else.')))
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
