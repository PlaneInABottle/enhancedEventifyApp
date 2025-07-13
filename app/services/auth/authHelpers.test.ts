import { validateEmail, validatePassword, mapAuthError } from './authHelpers'
import type { AuthError } from '@supabase/supabase-js'

/**
 * Unit tests for authentication helper functions
 */

describe('authHelpers', () => {
  // ========================================================================
  // EMAIL VALIDATION TESTS
  // ========================================================================
  
  describe('validateEmail', () => {
    it('should return valid for a proper email address', () => {
      const result = validateEmail('user@example.com')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for empty email', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:emailRequired')
    })

    it('should return invalid for email without @', () => {
      const result = validateEmail('userexample.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
    })

    it('should return invalid for email without domain', () => {
      const result = validateEmail('user@')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
    })

    it('should return invalid for email without username', () => {
      const result = validateEmail('@example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
    })

    it('should return invalid for email with spaces', () => {
      const result = validateEmail('user @example.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
    })

    it('should accept various valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ]

      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })
  })

  // ========================================================================
  // PASSWORD VALIDATION TESTS
  // ========================================================================
  
  describe('validatePassword', () => {
    it('should return valid for password with 6 characters', () => {
      const result = validatePassword('123456')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid for longer passwords', () => {
      const result = validatePassword('verylongpassword123')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for empty password', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:passwordRequired')
    })

    it('should return invalid for password less than 6 characters', () => {
      const result = validatePassword('12345')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:passwordMinLength')
    })

    it('should accept passwords with special characters', () => {
      const result = validatePassword('pass@123!')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept passwords with spaces', () => {
      const result = validatePassword('my password')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  // ========================================================================
  // ERROR MAPPING TESTS
  // ========================================================================
  
  describe('mapAuthError', () => {
    it('should map invalid login credentials error', () => {
      const mockError = {
        status: 400,
        message: 'Invalid login credentials'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('invalid_credentials')
      expect(result.message).toBe('errors:invalidCredentials')
      expect(result.originalError).toBe(mockError)
    })

    it('should map email not confirmed error', () => {
      const mockError = {
        status: 400,
        message: 'Email not confirmed'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('email_not_confirmed')
      expect(result.message).toBe('errors:emailNotConfirmed')
      expect(result.originalError).toBe(mockError)
    })

    it('should map too many requests error', () => {
      const mockError = {
        status: 429,
        message: 'Too many requests'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('too_many_requests')
      expect(result.message).toBe('errors:tooManyRequests')
      expect(result.originalError).toBe(mockError)
    })

    it('should map server errors (500)', () => {
      const mockError = {
        status: 500,
        message: 'Internal server error'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('service_unavailable')
      expect(result.message).toBe('errors:serviceUnavailable')
      expect(result.originalError).toBe(mockError)
    })

    it('should map server errors (502)', () => {
      const mockError = {
        status: 502,
        message: 'Bad gateway'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('service_unavailable')
      expect(result.message).toBe('errors:serviceUnavailable')
      expect(result.originalError).toBe(mockError)
    })

    it('should map server errors (503)', () => {
      const mockError = {
        status: 503,
        message: 'Service unavailable'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('service_unavailable')
      expect(result.message).toBe('errors:serviceUnavailable')
      expect(result.originalError).toBe(mockError)
    })

    it('should map network errors by message', () => {
      const mockError = {
        message: 'Network connection failed'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('network_error')
      expect(result.message).toBe('errors:networkError')
      expect(result.originalError).toBe(mockError)
    })

    it('should map fetch errors by message', () => {
      const mockError = {
        message: 'Fetch request failed'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('network_error')
      expect(result.message).toBe('errors:networkError')
      expect(result.originalError).toBe(mockError)
    })

    it('should map connection errors by message', () => {
      const mockError = {
        message: 'Connection timeout'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('network_error')
      expect(result.message).toBe('errors:networkError')
      expect(result.originalError).toBe(mockError)
    })

    it('should default to unknown error for unrecognized errors', () => {
      const mockError = {
        message: 'Some random error'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('unknown_error')
      expect(result.message).toBe('errors:unknownError')
      expect(result.originalError).toBe(mockError)
    })

    it('should handle case insensitive error message matching', () => {
      const mockError = {
        status: 400,
        message: 'INVALID LOGIN CREDENTIALS'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('invalid_credentials')
      expect(result.message).toBe('errors:invalidCredentials')
    })

    it('should handle errors without status property', () => {
      const mockError = {
        message: 'Some generic error'
      } as AuthError

      const result = mapAuthError(mockError)
      
      expect(result.type).toBe('unknown_error')
      expect(result.message).toBe('errors:unknownError')
      expect(result.originalError).toBe(mockError)
    })
  })
})