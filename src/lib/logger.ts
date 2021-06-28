import config from 'config'
import { merge } from 'lodash/fp'
import pino, { Logger, LoggerOptions } from 'pino'

const LOGGER_DEFAULT_NAME = 'meh'

const loggerDefaults: LoggerOptions = {
  base: {},
  level: 'info',
  prettyPrint: false,
  timestamp: false,
}

/**
 * Get a logger instance
 */
export const getLogger = (loggerName = ''): Logger => {
  const name = loggerName
    ? [LOGGER_DEFAULT_NAME, loggerName].join('/')
    : LOGGER_DEFAULT_NAME
  const loggerConfig = config.get<Partial<LoggerOptions>>('log')
  const options = merge(loggerDefaults, { ...loggerConfig, name })

  return pino(options)
}
