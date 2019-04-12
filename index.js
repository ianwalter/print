import { Log } from '@ianwalter/log'
import chalk from 'chalk'
import hasAnsi from 'has-ansi'
import hasEmoji from 'has-emoji'

const defaults = {
  types: ['debug', 'info', 'success', 'log', 'warn', 'error'],
  level: 'debug'
}
const atRE = /^\s+at\s(.*)/
const refRE = /^\s+at\s(.*)\s(\(.*\))$/
const toPaddedLines = full => line => `   ${full ? ' ' : ''}${line.trimStart()}`
const at = toPaddedLines(true)(chalk.gray('at'))
const byNotWhitespace = str => str && str.trim()

function toStackLines (line) {
  if (line.match(refRE)) {
    return line.replace(refRE, `${at} ${chalk.bold('$1')} ${chalk.gray('$2')}`)
  } else if (line.match(atRE)) {
    return line.replace(atRE, `${at} ${chalk.gray('$1')}`)
  }
}
function toFmt (item, index = 0, items) {
  let [newline, ...rest] = item.split('\n')

  // Handle formatting an item with newlines.
  if (rest.length && rest.some(item => item)) {
    return (newline || '\n') + rest.map(toPaddedLines(true)).join('\n')
  }

  // Handle formatting an item that comes after a newline.
  const last = index > 0 && items[index - 1]
  const lastIsString = typeof last === 'string'
  if (lastIsString && last.replace(' ', '')[last.length - 1] === '\n') {
    return toPaddedLines()(item)
  }

  return item
}

export class Print {
  constructor (options = {}) {
    return new Log(Object.assign({ logger: this }, defaults, options))
  }

  error (...messages) {
    const [err, ...rest] = messages
    if (err instanceof Error) {
      const { message: msg } = err
      const stackLines = err.stack.split('\n').map(toStackLines)
      const stack = '\n' + stackLines.filter(byNotWhitespace).join('\n')
      if (hasAnsi(msg)) {
        const error = chalk.red.bold('Error:')
        console.error('🚫 ', error, toFmt(msg), stack, ...rest.map(toFmt))
      } else {
        console.error('🚫 ', chalk.red.bold(toFmt(msg)), stack)
      }
    } else {
      console.error('🚫 ', chalk.red.bold(toFmt(err)), ...rest.map(toFmt))
    }
  }

  success (...messages) {
    const [msg, ...rest] = messages
    console.log('✅ ', chalk.green.bold(toFmt(msg)), ...rest.map(toFmt))
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
      first = chalk.bold(toFmt(actual))
      rest = actualRest
    }
    console.log(prefix, chalk.bold(toFmt(first)), ...rest.map(toFmt))
  }

  warn (...messages) {
    const [msg, ...rest] = messages
    console.warn('⚠️  ', chalk.yellow.bold(toFmt(msg)), ...rest.map(toFmt))
  }

  info (...messages) {
    const [msg, ...rest] = messages
    console.info('💁 ', chalk.blue.bold(toFmt(msg)), ...rest.map(toFmt))
  }

  debug (...messages) {
    const [msg, ...rest] = messages
    console.debug('🐛 ', chalk.magenta.bold(toFmt(msg)), ...rest.map(toFmt))
  }
}

export const print = new Print()

export { chalk }
