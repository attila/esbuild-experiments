import { concat, join, pipe } from 'lodash/fp'

export const yup = () => {
  const logger = dependencies.get('logger')

  if (process.env.FAIL) {
    logger.warn('danger')
    throw new Error('meh')
  } else {
    logger.info('returning yup')
  }

  return pipe(concat('u'), concat('y'), join(''))('p')
}
