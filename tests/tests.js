const { test } = require('@ianwalter/bff')
const execa = require('execa')

test('print', async ({ expect }) => {
  const { stdout } = await execa('yarn', ['example'])
  expect(stdout).toMatchSnapshot()
})
