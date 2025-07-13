import { supabase } from '@/clients/supabase/SupabaseClient'
import { validateEmail, validatePassword, mapAuthError } from './authHelpers'
import type { 
  SignInCredentials, 
  AuthResult, 
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