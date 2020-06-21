const { print } = require('../..')

// TODO: print.update({ ndjson: true })

const log = print.create({ ndjson: true })

log.info('Request to /')

console.log('Testing...')

log.warn('User not found', { userId: 123 })

console.log(JSON.stringify({ testing: 'No Message', response: { ok: true } }))
