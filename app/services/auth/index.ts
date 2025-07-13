/**
 * Auth Service Exports
 * 
 * Central export point for authentication functionality
 */

// Types
export type {
  SignInCredentials,
  AuthResult,
  AuthUser,
  UserProfile,
  BusinessProfile,
  ValidationResult,
  AuthErrorType,
  CustomAuthError,
  AuthResponse,
  UserResponse
} from './authTypes'

// Helper functions
export {
  validateEmail,
  validatePassword,
  mapAuthError
} from './authHelpers'

// Service functions
export {
  signIn
} from './authService'