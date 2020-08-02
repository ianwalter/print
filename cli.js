#!/usr/bin/env node

const cli = require('@ianwalter/cli')
const { print } = require('.')

const config = cli({
  name: '@ianwalter/print',
  options: {
    ansi: { default: true }
  }
})

const log = print.create(config)

function prettify (line) {
  let obj
  if (typeof line === 'string') {
    try {
      obj = JSON.parse(line)
    } catch (err) {
      // If the line couldn't be parsed as JSON, return it without formatting.
      return log.write(line)
    }
  }

  let { message, ...rest } = obj
  const type = obj.type || obj.level || 'log'
  const logger = config.ansi ? type : 'plain'
  const hasRest = Object.keys(rest).length
  message = message || `${type[0].toUpperCase()}${type.substring(1)}`
  log[logger](...[message, ...hasRest ? [rest] : []])
}

function prettifier (lines) {
  for (const line of lines.split('\n')) prettify(line)
}

if (config.help) {
  log.info(config.helpText)
} else {
  process.stdin.on('data', data => prettifier(data.toString()))
}
