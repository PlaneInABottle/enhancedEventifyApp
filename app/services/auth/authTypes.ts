import type { Session, User, AuthError } from '@supabase/supabase-js'

/**
 * Authentication Types for Enhanced Eventify
 * 
 * Based on Supabase auth types and our database schema
 */

// ============================================================================
// SIGN IN TYPES
// ============================================================================

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  session?: Session
  error?: string
}

// ============================================================================
// USER DATA TYPES
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  userType: 'user' | 'business'
  profile: UserProfile | null
  businessProfile: BusinessProfile | null
}

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  location_city: string | null
  is_profile_complete: boolean | null
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  business_name: string
  business_types: string[]
  description: string | null
  phone: string | null
  website_url: string | null
  logo_url: string | null
  business_status: 'pending' | 'verified' | 'suspended'
  is_profile_complete: boolean | null
  created_at: string
  updated_at: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// ============================================================================
// SUPABASE RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  data: {
    user: User | null
    session: Session | null
  }
  error: AuthError | null
}

export interface UserResponse {
  data: {
    user: User | null
  }
  error: AuthError | null
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type AuthErrorType = 
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'too_many_requests'
  | 'network_error'
  | 'service_unavailable'
  | 'unknown_error'

export interface CustomAuthError {
  type: AuthErrorType
  message: string
  originalError?: AuthError
}