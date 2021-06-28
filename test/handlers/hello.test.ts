// Test subject
import { handler } from '../../src/handlers/hello'

describe('hello', () => {
  it('returns output', () => {
    // Act
    const result = handler()
    // Assert
    expect(result).toBe('yup')
  })
})
