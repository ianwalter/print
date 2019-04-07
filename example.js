const { print, chalk } = require('.')

print.error('Environment variables not set!')
print.error(new Error('No assertions were executed.'))
print.error(new Error(chalk.bold('Expected something else.')))
print.warn('File was overwritten:', '\n', '/tmp/fakeFile.json')
print.info('Done in 0.91s.')
print.debug('Flaky test started.', `
  Make sure you check it out.
  Could be trouble.
`)
print.log('Request made to server.')
print.log('🔑', chalk.cyan('$2b$12$HMJFAblrhBCGxTWv5BnIFe'))
print.success('You did it!', 'Great job.')
