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
  UserResponse,
} from "./authTypes"

// Helper functions
export { mapAuthError } from "./authHelpers"

// Service functions
export { signIn, signUp, buildUserFromSession, requestPasswordReset } from "./authService"
