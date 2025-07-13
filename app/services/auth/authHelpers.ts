import { AuthError } from '@supabase/supabase-js'
import { translate } from '@/i18n/translate'
import type { TxKeyPath } from '@/i18n'
import type { 
  SignInCredentials, 
  ValidationResult, 
  AuthErrorType, 
  CustomAuthError 
} from './authTypes'

/**
 * Authentication Helper Functions
 * 
 * Pure utility functions for validation and error handling
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: 'errors:emailRequired' }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'errors:invalidEmail' }
  }
  
  return { isValid: true }
}

/**
 * Validates password requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'errors:passwordRequired' }
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'errors:passwordMinLength' }
  }
  
  return { isValid: true }
}

// ============================================================================
// ERROR MAPPING FUNCTIONS
// ============================================================================

/**
 * Maps Supabase AuthError to our CustomAuthError with translation keys
 * Based on real Supabase error patterns and HTTP status codes
 */
export function mapAuthError(error: AuthError): CustomAuthError {
  // Check if it's an AuthApiError with status code
  if ('status' in error) {
    const status = (error as any).status
    
    switch (status) {
      case 400:
        // Invalid credentials, validation errors
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return {
            type: 'invalid_credentials',
            message: 'errors:invalidCredentials',
            originalError: error
          }
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            type: 'email_not_confirmed',
            message: 'errors:emailNotConfirmed', 
            originalError: error
          }
        }
        break
        
      case 429:
        // Too many requests
        return {
          type: 'too_many_requests',
          message: 'errors:tooManyRequests',
          originalError: error
        }
        
      case 500:
      case 502:
      case 503:
        // Server errors
        return {
          type: 'service_unavailable',
          message: 'errors:serviceUnavailable',
          originalError: error
        }
    }
  }
  
  // Check error message patterns for other cases
  const errorMessage = error.message.toLowerCase()
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')) {
    return {
      type: 'network_error',
      message: 'errors:networkError',
      originalError: error
    }
  }
  
  // Default fallback for unknown errors
  return {
    type: 'unknown_error',
    message: 'errors:unknownError',
    originalError: error
  }
}