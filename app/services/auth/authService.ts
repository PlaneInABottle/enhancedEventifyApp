import { jwtDecode } from "jwt-decode"

import { supabase } from "@/clients/supabase/SupabaseClient"
import { validateEmail, validatePassword, validatePasswordConfirmation } from "@/utils/validation"

import { mapAuthError } from "./authHelpers"
import type {
  SignInCredentials,
  SignUpCredentials,
  AuthResult,
  SignUpResult,
  AuthUser,
} from "./authTypes"

/**
 * Authentication Service
 *
 * Handles user authentication operations using Supabase
 */

// ============================================================================
// JWT UTILITIES
// ============================================================================

/**
 * Builds an AuthUser object from a Supabase session with JWT claims
 */
export function buildUserFromSession(session: any): AuthUser | null {
  if (!session?.user || !session?.access_token) {
    return null
  }

  try {
    // Extract custom claims from JWT token
    const claims = jwtDecode(session.access_token) as any
    const customClaims = {
      userRole: claims.user_role || "user",
      permissions: claims.permissions || [],
      isBusinessUser: claims.is_business_user || false,
      businessStatus: claims.business_status || "none",
    }

    // Determine userType based on business status
    const userType: "user" | "business" = customClaims.isBusinessUser ? "business" : "user"

    return {
      id: session.user.id,
      email: session.user.email || "",
      userType: userType,
      profile: null,
      businessProfile: null,
      userRole: customClaims.userRole,
      permissions: customClaims.permissions,
      isBusinessUser: customClaims.isBusinessUser,
      businessStatus: customClaims.businessStatus,
    }
  } catch (error) {
    console.error("Error parsing JWT token in buildUserFromSession:", error)
    // Fallback to basic user without custom claims
    return {
      id: session.user.id,
      email: session.user.email || "",
      userType: "user",
      profile: null,
      businessProfile: null,
      userRole: "user",
      permissions: [],
      isBusinessUser: false,
      businessStatus: "none",
    }
  }
}

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
    if (!emailValidation.success) {
      return emailValidation
    }

    // Validate password
    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.success) {
      return passwordValidation
    }

    // Attempt sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      // Map Supabase error to our custom error format
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message,
      }
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: "errors:unknownError",
      }
    }

    // Build our AuthUser object with JWT claims
    const authUser = buildUserFromSession(data.session)
    if (!authUser) {
      return {
        success: false,
        error: "errors:unknownError",
      }
    }

    return {
      success: true,
      user: authUser,
      session: data.session,
    }
  } catch (error) {
    console.error("Unexpected error during sign in:", error)
    return {
      success: false,
      error: "errors:unknownError",
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
    if (!emailValidation.success) {
      return emailValidation
    }

    // Validate password
    const passwordValidation = validatePassword(credentials.password)
    if (!passwordValidation.success) {
      return passwordValidation
    }

    // Validate password confirmation
    const passwordConfirmationValidation = validatePasswordConfirmation(
      credentials.password,
      credentials.confirmPassword,
    )
    if (!passwordConfirmationValidation.success) {
      return passwordConfirmationValidation
    }

    // Attempt sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          user_type: credentials.userType,
        },
      },
    })

    if (error) {
      // Map Supabase error to our custom error format
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: "errors:unknownError",
      }
    }

    // Check if email confirmation is required
    const requiresEmailVerification = !data.session

    // Build our AuthUser object with JWT claims if session available
    let authUser: AuthUser
    if (data.session?.access_token) {
      // User signed in immediately - extract JWT claims
      authUser = buildUserFromSession(data.session) || {
        id: data.user.id,
        email: data.user.email || "",
        userType: credentials.userType,
        profile: null,
        businessProfile: null,
        userRole: credentials.userType,
        permissions: [],
        isBusinessUser: credentials.userType === "business",
        businessStatus: credentials.userType === "business" ? "pending" : "none",
      }
    } else {
      // Email verification required - basic user object
      authUser = {
        id: data.user.id,
        email: data.user.email || "",
        userType: credentials.userType,
        profile: null,
        businessProfile: null,
        userRole: credentials.userType,
        permissions: [],
        isBusinessUser: credentials.userType === "business",
        businessStatus: credentials.userType === "business" ? "pending" : "none",
      }
    }

    return {
      success: true,
      user: authUser,
      session: data.session || undefined,
      requiresEmailVerification,
    }
  } catch (error) {
    console.error("Unexpected error during sign up:", error)
    return {
      success: false,
      error: "errors:unknownError",
    }
  }
}

// ============================================================================
// PASSWORD RESET FUNCTIONALITY (Phase 1 - Request Reset Email Only)
// ============================================================================

/**
 * Requests a password reset email to be sent to the user.
 * Phase 1: Only sends the email, no token handling yet.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const emailValidation = validateEmail(email)
    if (!emailValidation.success) {
      return { success: false, error: emailValidation.error }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Will configure deep link in Phase 2
    })

    if (error) {
      const customError = mapAuthError(error)
      return { success: false, error: customError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error during password reset request:", error)
    return { success: false, error: "errors:unknownError" }
  }
}
