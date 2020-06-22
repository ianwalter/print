const util = require('util')
const chromafi = require('@ianwalter/chromafi')
const log = require('@ianwalter/log')
const chalk = require('chalk')
const hasAnsi = require('has-ansi')
const hasEmoji = require('has-emoji')
const clone = require('@ianwalter/clone')
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')
const stripAnsi = require('strip-ansi')
const merge = require('@ianwalter/merge')
const cloneable = require('@ianwalter/cloneable')

// Set up marked with the TerminalRenderer.
marked.setOptions({ renderer: new TerminalRenderer({ tab: 2 }) })

const defaults = {
  types: [
    'debug', // For debugging code through log statements.
    'log', // For general log statements in which you can customize the emoji.
    'info', // For standard log statements.
    'success', // For log statements indicating a successful operation.
    'warn', // For the gray area between info and error.
    'error', // For normal errors.
    'fatal', // For unrecoverable errors.
    'md', // For log statements in Markdown format.
    'plain', // For plain text without an emoji or ANSI escape sequences.
    'write' // For writing to the log without any formatting at all.
  ],
  // Write all logs to stdout by default. You can change std.err if you would
  // like to write errors to stderr, for example.
  std: {
    out: process.stdout.write.bind(process.stdout),
    err: process.stdout.write.bind(process.stdout)
  },
  level: 'debug',
  unrestricted: process.env.DEBUG,
  chalkLevel: chalk.level || 2,
  ndjson: false,
  collectItems ({ ndjson, namespace }, { type, level, prefix, items }) {
    if (ndjson) {
      return {
        ...items,
        ...namespace ? { namespace } : {},
        ...type ? { type } : {},
        level,
        message: items.message.trim()
      }
    }
    const ns = namespace ? chalk.bgWhite.black.bold(' ' + namespace + ' ') : ''
    return [...prefix ? [prefix] : [], ...ns ? [ns] : [], ...items]
  }
}
const chromafiOptions = { tabsToSpaces: 2, lineNumberPad: 0 }
const atRe = /^\s+at\s(.*)/
const refRe = /^\s+at\s(.*)\s(\(.*\))$/
const toPaddedString = s => `    ${s}`
const toPaddedLine = line => line ? toPaddedString(line) : line
const at = chalk.gray('at')
const byNotWhitespace = str => str && str.trim()
const startsWithANewline = msg => typeof msg === 'string' &&
  msg.replace(' ', '')[0] === '\n'
const endsWithANewline = msg => typeof msg === 'string' &&
  msg.replace(' ', '')[msg.length - 1] === '\n'
const md = str => marked(str).trimEnd()
const isObj = i => i && typeof i === 'object' && !Array.isArray(i)

function toStackLines (line) {
  if (line.match(refRe)) {
    return line.replace(refRe, `${at} ${chalk.bold('$1')} ${chalk.gray('$2')}`)
  } else if (line.match(atRe)) {
    return line.replace(atRe, `${at} ${chalk.gray('$1')}`)
  }
}

function getClone (src) {
  try {
    return clone(cloneable(src), { circulars: 0 })
  } catch (err) {
    return util.inspect(src)
  }
}

function toFormattedItems (color, isFirst = false, style) {
  const coloredChalk = color ? chalk[color] : chalk
  return (item, index = 0, items) => {
    if (item instanceof Error) {
      const { message, stack, ...rest } = item

      // Preface the log output with the error name.
      let str = ''
      if (isFirst) str = coloredChalk.bold(`${item.constructor.name}: `)

      // Format the error message with the given color and make it bold, unless
      // it's already formatted using ANSI escape sequences.
      if (hasAnsi(message)) {
        str += message
      } else {
        str += coloredChalk.bold(message)
      }

      // Format the error stacktrace.
      const stackLines = stack.split('\n').map(toStackLines)
      item = str + '\n' + stackLines.filter(byNotWhitespace).join('\n')

      // Add the rest of the Error properties to the item
      if (Object.keys(rest).length) {
        str = chromafi(getClone(rest), chromafiOptions)
        const end = str.lastIndexOf('\n\u001b[37m\u001b[39m')
        item += '\n' + (end > 0 ? str.substring(0, end) : str.trimEnd())
      }
    } else if (typeof item === 'object') {
      // If the item is an object, let chromafi format it.
      const str = chromafi(getClone(item), chromafiOptions)
      const end = str.lastIndexOf('\n\u001b[37m\u001b[39m')
      item = isFirst ? '' : '\n'
      item += end > 0 ? str.substring(0, end) : str.trimEnd()
    } else {
      // If the item is not a string, turn it into one using util.inspect.
      if (typeof item !== 'string') item = util.inspect(item)

      // If the item is the first item logged and isn't already formatted using
      // ANSI escape sequences, format it with the given color and make it bold.
      if (isFirst && !hasAnsi(item)) {
        item = style ? coloredChalk[style](item) : coloredChalk(item)
      }
    }

    // Split the item string by newlines.
    let [newline, ...rest] = item ? item.split('\n') : []

    // Handle formatting an item with newlines.
    if (rest.length) {
      newline = newline ? newline + '\n' : '\n'
      rest = rest.map(toPaddedLine)
    }

    // Handle formatting an item that comes after a newline.
    const previous = index > 0 && items[index - 1]
    if (typeof previous === 'string' && endsWithANewline(previous)) {
      newline = toPaddedLine(newline)
    }

    // Recombine the item string with newlines.
    return (newline || '') + rest.join('\n')
  }
}

function toSpacedString (acc, msg, idx, src) {
  if (endsWithANewline(msg)) {
    return acc + msg
  } else if (idx === src.length - 1) {
    return `${acc}${msg}\n`
  }
  return `${acc}${msg} `
}

function createPrint (options = {}) {
  options = merge({}, defaults, options)
  chalk.level = options.chalkLevel

  function createOutputString (log) {
    const items = options.collectItems(options, log)
    if (options.ndjson) return JSON.stringify(items) + '\n'
    return items.reduce(toSpacedString, '')
  }

  function formatItems ([first, ...rest], color, style) {
    if (options.ndjson) {
      return [first, ...rest].reduce(
        (acc, msg, idx, src) => {
          if (isObj(msg)) {
            acc.data = merge(acc.data || {}, msg)
          } else if (typeof msg === 'string') {
            acc.message = toSpacedString(acc.message || '', msg, idx, src)
          }
          return acc
        },
        {}
      )
    }
    const items = [toFormattedItems(color, true, style)(first)]
    return items.concat(rest.map(toFormattedItems(color)))
  }

  const logger = {
    create (options) {
      return createPrint(options)
    },
    debug (...items) {
      return this.writeOut({
        level: 'debug',
        prefix: '🐛 ',
        items: formatItems(items, 'magenta')
      })
    },
    log (first, ...rest) {
      let prefix = '   '
      if (typeof first === 'string' && hasEmoji(first)) {
        const [actual, ...actualRest] = rest
        prefix = first.padEnd(2 + [...first].length) // Emoji length trick!
        first = actual
        rest = actualRest
      }
      return this.writeOut({
        type: 'log',
        level: 'info',
        prefix,
        items: formatItems([first, ...rest])
      })
    },
    info (...items) {
      return this.writeOut({
        level: 'info',
        prefix: '💁 ',
        items: formatItems(items, 'blue', 'bold')
      })
    },
    success (...items) {
      return this.writeOut({
        type: 'success',
        level: 'info',
        prefix: '✅ ',
        items: formatItems(items, 'green', 'bold')
      })
    },
    warn (...items) {
      return this.writeOut({
        level: 'warn',
        prefix: '⚠️  ',
        items: formatItems(items, 'yellow', 'bold')
      })
    },
    error (...items) {
      return this.writeErr({
        level: 'error',
        prefix: '🚫 ',
        items: formatItems(items, 'red', 'bold')
      })
    },
    fatal (...items) {
      return this.writeErr({
        level: 'fatal',
        prefix: '💀 ',
        items: formatItems(items, 'red', 'bold')
      })
    },
    md (...items) {
      return this.writeOut({
        type: 'md',
        level: 'info',
        items: items.map(i => {
          const item = md(i).split('\n').map(toPaddedString).join('\n')
          return startsWithANewline(i) ? '\n' + item : item
        })
      })
    },
    plain (...items) {
      return this.writeOut({
        type: 'plain',
        level: 'info',
        prefix: '   ',
        items: items.map(toFormattedItems()).map(stripAnsi)
      })
    },
    write (...items) {
      return this.writeOut({ type: 'write', level: 'info', items })
    },
    writeOut (log) {
      const str = createOutputString(log)
      if (options.std) options.std.out(str)
      return str
    },
    writeErr (log) {
      const str = createOutputString(log)
      if (options.std) options.std.err(str)
      return str
    }
  }

  return log.create({ ...options, logger })
}

module.exports = { print: createPrint(), chalk, md }
