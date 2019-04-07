const { print } = require('.')

print.error('Environment variables not set!')
print.error(new Error('No assertions were executed.'))
print.warn('File was overwritten.')
print.info('Done in 0.91s.')
print.debug('Flaky test started.')
print.log('Request made to server.')
print.success('You did it!')
