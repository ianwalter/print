const { test } = require('@ianwalter/bff')
const execa = require('execa')
const stripAnsi = require('strip-ansi')
const { print } = require('..')

test('print', async t => {
  const env = { DEBUG: 'app.*' }
  const { stdout } = await execa('yarn', ['example'], { env })
  stdout.split('\n').forEach(line => {
    // Don't assert stacktrace lines.
    if (!stripAnsi(line).match(/ {4}at /)) {
      t.expect(line).toMatchSnapshot()
    }
  })
})

test('return', t => {
  const noStdout = print.create({ std: false })
  t.expect(noStdout.info('Ello Guvna')).toMatchSnapshot()
})
