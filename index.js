import { Log } from '@ianwalter/log'
import chalk from 'chalk'
import hasAnsi from 'has-ansi'
import hasEmoji from 'has-emoji'

const defaults = {
  types: ['debug', 'info', 'success', 'log', 'warn', 'error'],
  level: 'debug'
}
const atRe = /^\s+at\s(.*)/
const refRe = /^\s+at\s(.*)\s(\(.*\))$/
const toPaddedLines = (space = '') => line => line && `   ${space}${line}`
const at = toPaddedLines(' ')(chalk.gray('at'))
const byNotWhitespace = str => str && str.trim()

function toStackLines (line) {
  if (line.match(refRe)) {
    return line.replace(refRe, `${at} ${chalk.bold('$1')} ${chalk.gray('$2')}`)
  } else if (line.match(atRe)) {
    return line.replace(atRe, `${at} ${chalk.gray('$1')}`)
  }
}
function toFmt (item, index = 0, items) {
  let [newline, ...rest] = item.split('\n')

  // Handle formatting an item with newlines.
  if (rest.length) {
    newline = newline ? newline + '\n' : '\n'
    rest = rest.map(toPaddedLines(' '))
  }

  // Handle formatting an item that comes after a newline.
  const last = index > 0 && items[index - 1]
  const lastIsString = typeof last === 'string'
  if (lastIsString && last.replace(' ', '')[last.length - 1] === '\n') {
    newline = toPaddedLines()(newline)
  }

  return newline + rest.join('\n')
}

export class Print {
  constructor (options = {}) {
    return new Log(Object.assign({ logger: this }, defaults, options))
  }

  error (...messages) {
    console.error('🚫 ', ...messages.reduce((acc, err, index) => {
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
    console.log('✅ ', chalk.green.bold(toFmt(first)), ...rest.map(toFmt))
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
    console.log(prefix, chalk.bold(toFmt(first)), ...rest.map(toFmt))
  }

  warn (...messages) {
    const [first, ...rest] = messages
    console.warn('⚠️  ', chalk.yellow.bold(toFmt(first)), ...rest.map(toFmt))
  }

  info (...messages) {
    const [first, ...rest] = messages
    console.info('💁 ', chalk.blue.bold(toFmt(first)), ...rest.map(toFmt))
  }

  debug (...messages) {
    const [first, ...rest] = messages
    console.debug('🐛 ', chalk.magenta.bold(toFmt(first)), ...rest.map(toFmt))
  }
}

export const print = new Print()

export { chalk }
