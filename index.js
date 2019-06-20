const util = require('util')
const chromafi = require('chromafi')
const { Log } = require('@ianwalter/log')
const chalk = require('chalk')
const hasAnsi = require('has-ansi')
const hasEmoji = require('has-emoji')

// Stop chalk from disabling itself.
chalk.enabled = true
chalk.level = chalk.level || 2

const defaults = {
  types: ['debug', 'info', 'success', 'log', 'warn', 'error'],
  level: 'debug'
}
const atRe = /^\s+at\s(.*)/
const refRe = /^\s+at\s(.*)\s(\(.*\))$/
const toPaddedLine = line => line && `    ${line}`
const at = toPaddedLine(chalk.gray('at'))
const byNotWhitespace = str => str && str.trim()
const endsWithANewline = msg => msg.replace(' ', '')[msg.length - 1] === '\n'

function toStackLines (line) {
  if (line.match(refRe)) {
    return line.replace(refRe, `${at} ${chalk.bold('$1')} ${chalk.gray('$2')}`)
  } else if (line.match(atRe)) {
    return line.replace(atRe, `${at} ${chalk.gray('$1')}`)
  }
}
function toFmt (message, index = 0, messages) {
  message = typeof message === 'object'
    ? '\n' + chromafi(message, { indent: 2, lineNumberPad: 0 })
    : typeof message === 'string' ? message : util.inspect(message)
  let [newline, ...rest] = message ? message.split('\n') : []

  // Handle formatting an item with newlines.
  if (rest.length) {
    newline = newline ? newline + '\n' : '\n'
    rest = rest.map(toPaddedLine)
  }

  // Handle formatting an item that comes after a newline.
  const previous = index > 0 && messages[index - 1]
  const lastIsString = typeof previous === 'string'
  if (lastIsString && endsWithANewline(previous)) {
    newline = toPaddedLine(newline)
  }

  return (newline || '') + rest.join('\n')
}
function toSpacedString (acc, msg, idx, src) {
  if (endsWithANewline(msg)) {
    return `${acc}${msg}`
  } else if (idx === src.length - 1) {
    return `${acc}${msg}\n`
  }
  return `${acc}${msg} `
}

class Print {
  constructor (options = {}) {
    return new Log(Object.assign({ logger: this }, defaults, options))
  }

  write (...messages) {
    process.stdout.write(messages.reduce(toSpacedString, ''))
  }

  error (...messages) {
    this.write('🚫 ', ...messages.reduce((acc, err, index) => {
      if (err instanceof Error) {
        if (hasAnsi(err.message)) {
          if (index === 0) {
            acc.push(chalk.red.bold('Error:'))
          }
          acc.push(toFmt(err.message))
        } else {
          acc.push(chalk.red.bold(toFmt(err.message)))
        }
        const stackLines = err.stack.split('\n').map(toStackLines)
        acc.push('\n' + stackLines.filter(byNotWhitespace).join('\n'))
      } else if (index === 0) {
        acc.push(chalk.red.bold(toFmt(err)))
      } else {
        acc.push(toFmt(err))
      }
      return acc
    }, []))
  }

  success (...messages) {
    const [first, ...rest] = messages
    this.write('✅ ', chalk.green.bold(toFmt(first)), ...rest.map(toFmt))
  }

  log (...messages) {
    let [first, ...rest] = messages
    let prefix = '💬 '
    const prefixIsEmoji = first && hasEmoji(first) && first.length === 2
    if (!first || prefixIsEmoji) {
      const [actual, ...actualRest] = rest
      if (!first) {
        prefix = '   '
      } else if (prefixIsEmoji) {
        prefix = `${first} `
      }
      first = actual
      rest = actualRest
    }
    this.write(prefix, chalk.bold(toFmt(first)), ...rest.map(toFmt))
  }

  warn (...messages) {
    const [first, ...rest] = messages
    this.write('⚠️  ', chalk.yellow.bold(toFmt(first)), ...rest.map(toFmt))
  }

  info (...messages) {
    const [first, ...rest] = messages
    this.write('💁 ', chalk.blue.bold(toFmt(first)), ...rest.map(toFmt))
  }

  debug (...messages) {
    const [first, ...rest] = messages
    this.write('🐛 ', chalk.magenta.bold(toFmt(first)), ...rest.map(toFmt))
  }
}

module.exports = { Print, print: new Print(), chalk }
