export interface Retry {
  retryable: boolean
  nextRetry?: Date
}

/**
 * Error implementation that encapsulates another error and extra contextual
 * information to aid debugging.
 */
export class EncapsulatedError extends Error {
  reason?: Error | Error[]
  details?: never
  private retry?: Retry
  nextRetry?: Date

  constructor(
    message: string,
    err?: Error | Error[],
    context?: unknown,
    retry?: Retry,
  ) {
    super(message)

    Object.defineProperty(this, 'name', {
      value: (<Error>this).constructor.name,
    })

    if (retry) {
      Object.defineProperty(this, 'retry', { value: retry })
    }

    if (retry && retry.nextRetry) {
      this.nextRetry = retry.nextRetry
    }

    if (err) {
      Object.defineProperty(this, 'reason', {
        value: err,
        enumerable: true,
        writable: true,
      })
    }

    if (context) {
      Object.defineProperty(this, 'details', {
        value: context,
        enumerable: true,
      })
    }

    Error.captureStackTrace(this, this.constructor)
  }

  public get retryable(): boolean {
    return this.isRetryable()
  }

  isRetryable() {
    const error = !Array.isArray(this.reason) ? [this.reason] : this.reason
    const reasonRetryable = error.every(
      (err) => err instanceof EncapsulatedError && err.retryable,
    )

    return this.retry && typeof this.retry.retryable !== 'undefined'
      ? this.retry.retryable
      : reasonRetryable
  }

  /**
   * Custom serializer implementation
   *
   * By default, Error instances do not serialise in JS. However,
   * EncapsulatedError instances contain a lot of useful, enumerable information
   * that should be serializable for debugging purposes (e.g in Rollbar)
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#tojson_behavior
   * @returns {{[p: string]: unknown}}
   */
  toJSON(): { [key: string]: unknown } {
    return Array.from(Object.entries(this)).reduce(
      (acc, [key, value]) => {
        return {
          ...acc,
          [key]: EncapsulatedError.getJSONValue(key, value),
        }
      },
      {
        name: this.name,
        message: this.message,
        stack: this.stack,
      },
    )
  }

  private static renderValue(value: unknown): unknown {
    if (value instanceof EncapsulatedError) {
      return value.toJSON()
    }
    if (value instanceof Error) {
      return value.toString()
    }

    return value
  }

  private static getJSONValue(key: string, value: unknown): unknown {
    if (key !== 'reason') {
      return value
    }

    if (Array.isArray(value)) {
      return value.map((v) =>
        v.toJSON ? v.toJSON() : EncapsulatedError.renderValue(v),
      )
    }

    return EncapsulatedError.renderValue(value)
  }

  /**
   * Custom string conversion method that includes encapsulated error information
   *
   * @returns {string}
   */
  toString(): string {
    if (!this.reason) {
      return `${this.name}: ${this.message}`
    }

    if (!Array.isArray(this.reason)) {
      return `${this.name}: ${this.message} [${this.reason.toString()}]`
    }

    const reasons = this.reason.map((item) => item.toString()).join('; ')

    return `${this.name}: ${this.message} [${reasons}]`
  }
}
