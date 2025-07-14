import { supabase } from '@/clients/supabase/SupabaseClient'
import { validateEmail, validatePassword, validatePasswordConfirmation, mapAuthError } from './authHelpers'
import type { 
  SignInCredentials, 
  SignUpCredentials,
  AuthResult, 
  SignUpResult,
  AuthUser,
  CustomAuthError 
} from './authTypes'

/**
 * Authentication Service
 * 
 * Handles user authentication operations using Supabase
 */

// ============================================================================
// SIGN IN FUNCTIONALITY
// ============================================================================

/**
 * Signs in a user with email and password
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  try {
    // Validate email
    const emailValidation = validateEmail(credentials.email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.error
      }
    }
    
    // Validate password
    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error
      }
    }
    
    // Attempt sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })
    
    if (error) {
      // Map Supabase error to our custom error format
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }
    
    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'errors:unknownError'
      }
    }
    
    // Build our AuthUser object
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      userType: 'user', // Default, will be updated when we fetch profile
      profile: null,
      businessProfile: null
    }
    
    return {
      success: true,
      user: authUser,
      session: data.session
    }
    
  } catch (error) {
    console.error('Unexpected error during sign in:', error)
    return {
      success: false,
      error: 'errors:unknownError'
    }
  }
}

// ============================================================================
// SIGN UP FUNCTIONALITY
// ============================================================================

/**
 * Signs up a new user with email, password, and user type
 */
export async function signUp(credentials: SignUpCredentials): Promise<SignUpResult> {
  try {
    // Validate email
    const emailValidation = validateEmail(credentials.email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.error
      }
    }
    
    // Validate password
    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error
      }
    }
    
    // Validate password confirmation
    const passwordConfirmationValidation = validatePasswordConfirmation(
      credentials.password, 
      credentials.confirmPassword
    )
    if (!passwordConfirmationValidation.isValid) {
      return {
        success: false,
        error: passwordConfirmationValidation.error
      }
    }
    
    // Attempt sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          user_type: credentials.userType
        }
      }
    })
    
    if (error) {
      // Map Supabase error to our custom error format
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }
    
    if (!data.user) {
      return {
        success: false,
        error: 'errors:unknownError'
      }
    }
    
    // Check if email confirmation is required
    const requiresEmailVerification = !data.session
    
    // Build our AuthUser object
    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      userType: credentials.userType,
      profile: null,
      businessProfile: null
    }
    
    return {
      success: true,
      user: authUser,
      session: data.session || undefined,
      requiresEmailVerification
    }
    
  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    return {
      success: false,
      error: 'errors:unknownError'
    }
  }
}