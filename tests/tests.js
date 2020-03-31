const { test } = require('@ianwalter/bff')
const execa = require('execa')
const stripAnsi = require('strip-ansi')
const { Print } = require('..')

test('print', async ({ expect }) => {
  const { stdout } = await execa('yarn', ['example'])
  stdout.split('\n').forEach(line => {
    // Don't assert stacktrace lines.
    if (!stripAnsi(line).match(/ {4}at /)) {
      expect(line).toMatchSnapshot()
    }
  })
})

test('return', ({ expect }) => {
  const print = new Print({ std: false })
  expect(print.info('Ello Guvna')).toMatchSnapshot()
})
