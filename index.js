import { Log } from '@ianwalter/log'
import chalk from 'chalk'
import hasAnsi from 'has-ansi'

const defaults = {
  types: ['debug', 'info', 'success', 'log', 'warn', 'error'],
  level: 'debug'
}
const toStackLines = line => {
  if (line.includes('(')) {
    const [ref, path] = line.trim().split(' ')
    return `${chalk.bold(ref)} ${chalk.gray(path)}`
  }
  return chalk.gray(line.trimStart())
}
const toPaddedLines = full => line => `   ${full ? ' ' : ''}${line.trimStart()}`
const toRest = (item, index, items) => {
  let [newline, ...rest] = item.split('\n')

  // Handle formatting an item with newlines.
  if (rest.length && rest[0]) {
    newline = newline.replace(' ', '') === '' ? '\n' : newline
    return newline + rest.map(toPaddedLines(true)).join('\n')
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
      const [_, ...lines] = err.stack.split('at')
      const at = chalk.gray('\n    at ')
      const stack = at + lines.map(toStackLines).join(at)
      if (hasAnsi(err.message)) {
        const error = chalk.red.bold('Error:')
        console.error('🚫 ', error, err.message, stack, ...rest.map(toRest))
      } else {
        console.error('🚫 ', chalk.red.bold(err.message), stack)
      }
    } else {
      console.error('🚫 ', chalk.red.bold(err), ...rest.map(toRest))
    }
  }

  success (...messages) {
    const [message, ...rest] = messages
    console.log('✅ ', chalk.green.bold(message), ...rest.map(toRest))
  }

  log (...messages) {
    const [message, ...rest] = messages
    console.log('💬 ', chalk.bold(message), ...rest.map(toRest))
  }

  warn (...messages) {
    const [message, ...rest] = messages
    console.warn('⚠️  ', chalk.yellow.bold(message), ...rest.map(toRest))
  }

  info (...messages) {
    const [message, ...rest] = messages
    console.info('💁 ', chalk.blue.bold(message), ...rest.map(toRest))
  }

  debug (...messages) {
    const [message, ...rest] = messages
    console.debug('🐛 ', chalk.magenta.bold(message), ...rest.map(toRest))
  }
}

export const print = new Print()

export { chalk }
