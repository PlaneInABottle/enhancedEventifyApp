import type {
  ProfileValidationResult,
  CustomProfileError,
  ProfileErrorType,
  UserProfile,
  ProfileCompletionStatus
} from './profileTypes'

/**
 * Profile Helper Functions
 * 
 * Pure utility functions for validation and error handling
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates display name format
 */
export function validateDisplayName(displayName: string): ProfileValidationResult {
  if (!displayName || displayName.trim().length === 0) {
    return { isValid: false, error: 'errors:displayNameRequired' }
  }

  if (displayName.length < 2) {
    return { isValid: false, error: 'errors:displayNameTooShort' }
  }

  if (displayName.length > 50) {
    return { isValid: false, error: 'errors:displayNameTooLong' }
  }

  // Allow letters (including Turkish characters), numbers, spaces, and common punctuation
  const validNameRegex = /^[\p{L}0-9\s\-_.]+$/u
  if (!validNameRegex.test(displayName)) {
    return { isValid: false, error: 'errors:displayNameInvalidCharacters' }
  }

  return { isValid: true }
}

/**
 * Validates bio content
 */
export function validateBio(bio: string): ProfileValidationResult {
  if (bio.length > 500) {
    return { isValid: false, error: 'errors:bioTooLong' }
  }

  return { isValid: true }
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats display name for consistency
 */
export function formatDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Gets avatar URL with fallback
 */
export function getAvatarUrl(profile: UserProfile | null): string {
  if (profile?.avatar_url) {
    return profile.avatar_url
  }
  // Return default avatar URL
  return '/images/default-avatar.png'
}

/**
 * Gets initials from display name
 */
export function getInitials(displayName: string | null): string {
  if (!displayName) return '?'

  const names = displayName.trim().split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }

  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

// ============================================================================
// ERROR MAPPING FUNCTIONS
// ============================================================================

/**
 * Maps profile service errors to custom errors
 */
export function mapProfileError(error: any): CustomProfileError {
  if (error?.status === 404) {
    return {
      type: 'profile_not_found',
      message: 'errors:profileNotFound',
      originalError: error
    }
  }

  if (error?.message?.includes('network')) {
    return {
      type: 'network_error',
      message: 'errors:networkError',
      originalError: error
    }
  }

  if (error?.message?.includes('storage')) {
    return {
      type: 'storage_error',
      message: 'errors:storageError',
      originalError: error
    }
  }

  if (error?.message?.includes('upload')) {
    return {
      type: 'upload_failed',
      message: 'errors:uploadFailed',
      originalError: error
    }
  }

  if (error?.message?.includes('file') && error?.message?.includes('type')) {
    return {
      type: 'invalid_file_type',
      message: 'errors:invalidFileType',
      originalError: error
    }
  }

  if (error?.message?.includes('file') && error?.message?.includes('size')) {
    return {
      type: 'file_too_large',
      message: 'errors:fileTooLarge',
      originalError: error
    }
  }

  return {
    type: 'unknown_error',
    message: 'errors:unknownError',
    originalError: error
  }
}
