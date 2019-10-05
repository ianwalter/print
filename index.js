const util = require('util')
const chromafi = require('@ianwalter/chromafi')
const { Log } = require('@ianwalter/log')
const chalk = require('chalk')
const hasAnsi = require('has-ansi')
const hasEmoji = require('has-emoji')
const clone = require('@ianwalter/clone')
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')

// Set up marked with the TerminalRenderer.
marked.setOptions({ renderer: new TerminalRenderer() })

const defaults = {
  types: [
    'debug', // For debugging code through log statements.
    'log', // For general log statements in which you can customize the emoji.
    'info', // For standard log statements.
    'success', // For log statements indicating a successful operation.
    'warn', // Warn 'em Cassandra.
    'error', // For normal errors.
    'fatal', // For unrecoverable errors.
    'md', // For log statements in Markdown format.
    'text', // For outputting text without an emoji or
    'write' // For writing to the log without any formatting at all.
  ],
  level: 'debug',
  // Stop chalk from disabling itself.
  chalkEnabled: true,
  chalkLevel: chalk.level || 2
}
const chromafiOptions = { tabsToSpaces: 2, lineNumberPad: 0 }
const atRe = /^\s+at\s(.*)/
const refRe = /^\s+at\s(.*)\s(\(.*\))$/
const toPaddedLine = line => line && `    ${line}`
const at = toPaddedLine(chalk.gray('at'))
const byNotWhitespace = str => str && str.trim()
const endsWithANewline = msg => msg.replace(' ', '')[msg.length - 1] === '\n'
const md = str => marked(str).trimEnd()

function toStackLines (line) {
  if (line.match(refRe)) {
    return line.replace(refRe, `${at} ${chalk.bold('$1')} ${chalk.gray('$2')}`)
  } else if (line.match(atRe)) {
    return line.replace(atRe, `${at} ${chalk.gray('$1')}`)
  }
}

function getClone (src) {
  try {
    return clone(src, { circulars: false })
  } catch (err) {
    return util.inspect(src)
  }
}

function toFmt (message, index = 0, messages) {
  message = typeof message === 'object'
    ? '\n' + chromafi(getClone(message), chromafiOptions)
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
    return acc + msg
  } else if (idx === src.length - 1) {
    return `${acc}${msg}\n`
  }
  return `${acc}${msg} `
}

function toErrorMessages (color = 'red') {
  return (acc, err, index) => {
    if (err instanceof Error) {
      if (hasAnsi(err.message)) {
        if (index === 0) {
          acc.push(chalk[color].bold('Error:'))
        }
        acc.push(toFmt(err.message))
      } else {
        acc.push(chalk[color].bold(toFmt(err.message)))
      }
      const stackLines = err.stack.split('\n').map(toStackLines)
      acc.push('\n' + stackLines.filter(byNotWhitespace).join('\n'))
    } else if (index === 0) {
      acc.push(chalk[color].bold(toFmt(err)))
    } else {
      acc.push(toFmt(err))
    }
    return acc
  }
}

class Print {
  constructor (options = {}) {
    this.options = Object.assign({ logger: this }, defaults, options)
    chalk.enabled = this.options.chalkEnabled
    chalk.level = this.options.chalkLevel
    return new Log(this.options)
  }

  debug (...messages) {
    const [first, ...rest] = messages
    this.write('🐛 ', chalk.magenta.bold(toFmt(first)), ...rest.map(toFmt))
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

  info (...messages) {
    const [first, ...rest] = messages
    this.write('💁 ', chalk.blue.bold(toFmt(first)), ...rest.map(toFmt))
  }

  success (...messages) {
    const [first, ...rest] = messages
    this.write('✅ ', chalk.green.bold(toFmt(first)), ...rest.map(toFmt))
  }

  warn (...messages) {
    this.write('⚠️  ', ...messages.reduce(toErrorMessages('yellow'), []))
  }

  error (...messages) {
    this.write('🚫 ', ...messages.reduce(toErrorMessages(), []))
  }

  fatal (...messages) {
    this.write('☠️  ', ...messages.reduce(toErrorMessages(), []))
  }

  md (...messages) {
    this.text(...messages.map(message => md(message)), '\n')
  }

  text (...messages) {
    this.write('   ', ...messages.map(toFmt))
  }

  write (...messages) {
    process.stdout.write(messages.reduce(toSpacedString, ''))
  }
}

module.exports = { Print, print: new Print(), chalk, md }
