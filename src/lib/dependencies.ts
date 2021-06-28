import { EncapsulatedError } from './encapsulatedError'
import { Logger } from 'pino'

/**
 * Registry of recognised dependencies
 *
 * The dependency injection container can only be used with dependencies that
 * are defined here. All properties defined in this interface must be optional.
 *
 * @type Dependencies
 */
export interface Dependencies {
  logger?: Logger
}

class DependencyInjectionError extends EncapsulatedError {
  isRetryable(): boolean {
    return false
  }
}

class Container<T> {
  private map: Map<keyof T, unknown>

  constructor() {
    this.map = new Map()
  }

  /**
   * Get a dependency from the container
   */
  get<K extends keyof T>(key: K): Required<T>[K] {
    if (!this.map.has(key)) {
      throw new DependencyInjectionError(`Dependency ${key} not found`)
    }

    return this.map.get(key) as T[K]
  }

  /**
   * Check if a dependency has already been injected
   */
  has<K extends keyof T>(key: K): boolean {
    return this.map.has(key)
  }

  /**
   * Put a dependency in the container
   */
  inject<K extends keyof T>(key: K, value: T[K]): void {
    if (this.map.has(key)) {
      throw new DependencyInjectionError(
        `Dependency ${key} already injected. Did you mean to replace it?`,
      )
    }

    this.map.set(key, value)
  }

  /**
   * Replace a dependency in the container at the specified key
   */
  replace<K extends keyof T>(key: K, value: T[K]): void {
    if (!this.map.has(key)) {
      throw new DependencyInjectionError(
        `Dependency ${key} not found. Did you mean to inject it?`,
      )
    }

    this.map.set(key, value)
  }
}

global.dependencies = new Container<Dependencies>()

declare global {
  const dependencies: Container<Dependencies>
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      dependencies: Container<Dependencies>
    }
  }
}
