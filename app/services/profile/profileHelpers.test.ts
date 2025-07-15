import { 
  validateDisplayName, 
  validateBio, 
  formatDisplayName,
  getAvatarUrl,
  getInitials,
  mapProfileError
} from './profileHelpers'
import type { UserProfile } from './profileTypes'

describe('profileHelpers', () => {
  // Helper function to create mock profiles
  const createMockProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: '123',
    display_name: null,
    avatar_url: null,
    bio: null,
    location_city: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('validateDisplayName', () => {
    it('should accept valid display names', () => {
      const result = validateDisplayName('John Doe')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty display names', () => {
      const result = validateDisplayName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:displayNameRequired')
    })

    it('should reject display names that are too short', () => {
      const result = validateDisplayName('A')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:displayNameTooShort')
    })

    it('should reject display names that are too long', () => {
      const longName = 'A'.repeat(51)
      const result = validateDisplayName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:displayNameTooLong')
    })

    it('should reject display names with invalid characters', () => {
      const result = validateDisplayName('John@Doe')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:displayNameInvalidCharacters')
    })

    it('should accept display names with valid special characters', () => {
      const result = validateDisplayName('John-Doe_Jr.')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateBio', () => {
    it('should accept valid bios', () => {
      const result = validateBio('This is a valid bio')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept empty bios', () => {
      const result = validateBio('')
      expect(result.isValid).toBe(true)
    })

    it('should reject bios that are too long', () => {
      const longBio = 'A'.repeat(501)
      const result = validateBio(longBio)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('errors:bioTooLong')
    })

    it('should accept bios at the maximum length', () => {
      const maxBio = 'A'.repeat(500)
      const result = validateBio(maxBio)
      expect(result.isValid).toBe(true)
    })
  })


  // ============================================================================
  // FORMATTING TESTS
  // ============================================================================

  describe('formatDisplayName', () => {
    it('should trim whitespace from display name', () => {
      const result = formatDisplayName('  John Doe  ')
      expect(result).toBe('John Doe')
    })

    it('should replace multiple spaces with single space', () => {
      const result = formatDisplayName('John    Doe')
      expect(result).toBe('John Doe')
    })

    it('should handle mixed whitespace issues', () => {
      const result = formatDisplayName('  John    Doe  Jr.  ')
      expect(result).toBe('John Doe Jr.')
    })
  })

  describe('getAvatarUrl', () => {
    it('should return avatar URL when profile has one', () => {
      const profile = createMockProfile({
        avatar_url: 'https://example.com/avatar.jpg'
      })
      const result = getAvatarUrl(profile)
      expect(result).toBe('https://example.com/avatar.jpg')
    })

    it('should return default avatar URL when profile has no avatar', () => {
      const profile = createMockProfile({ avatar_url: null })
      const result = getAvatarUrl(profile)
      expect(result).toBe('/images/default-avatar.png')
    })

    it('should return default avatar URL when profile is null', () => {
      const result = getAvatarUrl(null)
      expect(result).toBe('/images/default-avatar.png')
    })
  })

  describe('getInitials', () => {
    it('should return initials for full name', () => {
      const result = getInitials('John Doe')
      expect(result).toBe('JD')
    })

    it('should return first two characters for single name', () => {
      const result = getInitials('John')
      expect(result).toBe('JO')
    })

    it('should return question mark for null name', () => {
      const result = getInitials(null)
      expect(result).toBe('?')
    })

    it('should return question mark for empty name', () => {
      const result = getInitials('')
      expect(result).toBe('?')
    })

    it('should handle multiple names correctly', () => {
      const result = getInitials('John Michael Doe Jr.')
      expect(result).toBe('JJ')
    })

    it('should handle extra whitespace', () => {
      const result = getInitials('  John   Doe  ')
      expect(result).toBe('JD')
    })
  })

  describe('mapProfileError', () => {
    it('should map 404 error to profile_not_found', () => {
      const error = { status: 404, message: 'Not found' }
      const result = mapProfileError(error)
      
      expect(result.type).toBe('profile_not_found')
      expect(result.message).toBe('errors:profileNotFound')
      expect(result.originalError).toBe(error)
    })

    it('should map network errors correctly', () => {
      const error = { message: 'network connection failed' }
      const result = mapProfileError(error)
      
      expect(result.type).toBe('network_error')
      expect(result.message).toBe('errors:networkError')
      expect(result.originalError).toBe(error)
    })

    it('should map unknown errors to unknown_error', () => {
      const error = { message: 'Something went wrong' }
      const result = mapProfileError(error)
      
      expect(result.type).toBe('unknown_error')
      expect(result.message).toBe('errors:unknownError')
      expect(result.originalError).toBe(error)
    })
  })
})