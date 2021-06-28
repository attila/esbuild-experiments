import '../lib/dependencies'
import { yup } from '../utils/string'
import { getLogger } from '../lib/logger'

const logger = getLogger()
dependencies.inject('logger', logger)

export const handler = (): string => {
  return yup()
}
