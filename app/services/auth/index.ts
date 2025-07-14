/**
 * Auth Service Exports
 * 
 * Central export point for authentication functionality
 */

// Types
export type {
  SignInCredentials,
  SignUpCredentials,
  SignUpResult,
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
  validatePasswordConfirmation,
  mapAuthError
} from './authHelpers'

// Service functions
export {
  signIn,
  signUp,
  buildUserFromSession
} from './authService'