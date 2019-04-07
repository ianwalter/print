import { Log } from '@ianwalter/log'
import chalk from 'chalk'
import hasAnsi from 'has-ansi'
import hasEmoji from 'has-emoji'

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
const toFmt = (item, index = 0, items) => {
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
      const { message: msg } = err
      const [_, ...lines] = err.stack.split('at')
      const at = chalk.gray('\n    at ')
      const stack = at + lines.map(toStackLines).join(at)
      if (hasAnsi(err.message)) {
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
    let [msg, ...rest] = messages
    if (hasEmoji(msg) && msg.length === 2) {
      const [actual, ...msgs] = rest
      console.log(`${msg} `, chalk.bold(toFmt(actual)), ...msgs.map(toFmt))
    } else {
      console.log('💬 ', chalk.bold(toFmt(msg)), ...rest.map(toFmt))
    }
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
