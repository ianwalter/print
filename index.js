import { Log } from '@ianwalter/log'
import chalk from 'chalk'

const defaults = {
  types: ['debug', 'info', 'warn', 'error', 'log', 'success'],
  level: 'debug'
}

const toStackLine = line => {
  if (line.includes('(')) {
    const [ref, path] = line.trim().split(' ')
    line = `${chalk.bold(ref)} ${chalk.gray(path)}`
  } else {
    line = chalk.gray(line.trim())
  }
  return line
}

export class Print {
  constructor (options = {}) {
    return new Log(Object.assign({ logger: this }, defaults, options))
  }

  error (err) {
    if (err instanceof Error) {
      const [_, ...lines] = err.stack.split('at')
      const at = chalk.gray('\n    at ')
      const stack = at + lines.map(toStackLine).join(at)
      console.error('🚫 ', chalk.red.bold(err.message), stack)
    } else {
      console.error('🚫 ', chalk.red.bold(err))
    }
  }

  success (...messages) {
    const [message, ...rest] = messages
    console.log('✅ ', chalk.green.bold(message), ...rest)
  }

  log (...messages) {
    const [message, ...rest] = messages
    console.log('💬 ', chalk.bold(message), ...rest)
  }

  warn (...messages) {
    const [message, ...rest] = messages
    console.warn('⚠️  ', chalk.yellow.bold(message), ...rest)
  }

  info (...messages) {
    const [message, ...rest] = messages
    console.info('💁 ', chalk.blue.bold(message), ...rest)
  }

  debug (...messages) {
    const [message, ...rest] = messages
    console.debug('🐛 ', chalk.magenta.bold(message), ...rest)
  }
}

export const print = new Print()
