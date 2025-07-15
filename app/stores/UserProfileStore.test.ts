import { UserProfileStore } from './UserProfileStore'
import * as profileService from '@/services/profile/profileService'
import { UserProfileModel } from '@/models/ProfileModels'

// Mock the profile service
jest.mock('@/services/profile/profileService', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  uploadAvatar: jest.fn(),
}))

const mockProfileService = profileService as jest.Mocked<typeof profileService>

describe('UserProfileStore', () => {
  let store: typeof UserProfileStore.Type

  beforeEach(() => {
    jest.clearAllMocks()
    store = UserProfileStore.create()
  })

  const mockProfile = {
    id: 'user-123',
    display_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Software developer',
    location_city: 'İstanbul' as const,
    is_profile_complete: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  describe('views', () => {
    it('should return correct hasProfile when profile exists', () => {
      store.setProfile(UserProfileModel.create(mockProfile))
      expect(store.hasProfile).toBe(true)
    })

    it('should return false for hasProfile when no profile', () => {
      expect(store.hasProfile).toBe(false)
    })

    it('should return correct display name', () => {
      store.setProfile(UserProfileModel.create(mockProfile))
      expect(store.displayName).toBe('John Doe')
    })

    it('should return null for display name when no profile', () => {
      expect(store.displayName).toBe(null)
    })
  })

  describe('actions', () => {
    it('should set profile correctly', () => {
      const profile = UserProfileModel.create(mockProfile)
      store.setProfile(profile)
      expect(store.profile).toBe(profile)
    })

    it('should set loading state', () => {
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('should set error', () => {
      store.setError('errors:testError')
      expect(store.lastError).toBe('errors:testError')
    })

    it('should clear error', () => {
      store.setError('errors:testError')
      store.clearError()
      expect(store.lastError).toBe(null)
    })
  })

  describe('fetchProfile flow', () => {
    it('should fetch profile successfully', async () => {
      mockProfileService.getUserProfile.mockResolvedValue({
        success: true,
        profile: mockProfile
      })

      const result = await store.fetchProfile('user-123')

      expect(mockProfileService.getUserProfile).toHaveBeenCalledWith('user-123')
      expect(result.success).toBe(true)
      expect(store.profile?.id).toBe('user-123')
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe(null)
    })

    it('should handle fetch profile error', async () => {
      mockProfileService.getUserProfile.mockResolvedValue({
        success: false,
        error: 'errors:profileNotFound'
      })

      const result = await store.fetchProfile('user-123')

      expect(result.success).toBe(false)
      expect(store.profile).toBe(null)
      expect(store.lastError).toBe('errors:profileNotFound')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('updateProfile flow', () => {
    const mockUpdates = {
      display_name: 'Updated Name',
      bio: 'Updated bio',
      location_city: 'Ankara' as const
    }

    const mockUpdatedProfile = {
      ...mockProfile,
      display_name: 'Updated Name',
      bio: 'Updated bio',
      location_city: 'Ankara' as const,
      updated_at: '2025-01-02T00:00:00Z'
    }

    it('should update profile successfully', async () => {
      // Set up initial profile
      store.setProfile(mockProfile)
      
      mockProfileService.updateUserProfile.mockResolvedValue({
        success: true,
        profile: mockUpdatedProfile
      })

      const result = await store.updateProfile('user-123', mockUpdates)

      expect(mockProfileService.updateUserProfile).toHaveBeenCalledWith('user-123', mockUpdates)
      expect(result.success).toBe(true)
      expect(store.profile?.display_name).toBe('Updated Name')
      expect(store.profile?.bio).toBe('Updated bio')
      expect(store.profile?.location_city).toBe('Ankara')
      expect(store.isUpdating).toBe(false)
      expect(store.lastError).toBe(null)
    })

    it('should handle update profile error', async () => {
      mockProfileService.updateUserProfile.mockResolvedValue({
        success: false,
        error: 'errors:validationFailed'
      })

      const result = await store.updateProfile('user-123', mockUpdates)

      expect(result.success).toBe(false)
      expect(store.lastError).toBe('errors:validationFailed')
      expect(store.isUpdating).toBe(false)
    })
  })

  describe('uploadAvatar flow', () => {
    const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' }) as any
    const mockAvatarUrl = 'https://example.com/new-avatar.jpg'

    beforeEach(() => {
      // Set up initial profile for avatar upload tests
      store.setProfile(UserProfileModel.create(mockProfile))
    })

    it('should upload avatar successfully and update profile', async () => {
      mockProfileService.uploadAvatar.mockResolvedValue({
        success: true,
        avatarUrl: mockAvatarUrl
      })

      const result = await store.uploadAvatar('user-123', mockFile)

      expect(mockProfileService.uploadAvatar).toHaveBeenCalledWith('user-123', mockFile)
      expect(result.success).toBe(true)
      expect(store.profile?.avatar_url).toBe(mockAvatarUrl)
      expect(store.isUploading).toBe(false)
      expect(store.lastError).toBe(null)
    })

    it('should handle upload avatar error', async () => {
      mockProfileService.uploadAvatar.mockResolvedValue({
        success: false,
        error: 'errors:fileTooLarge'
      })

      const result = await store.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(false)
      expect(store.lastError).toBe('errors:fileTooLarge')
      expect(store.profile?.avatar_url).toBe('https://example.com/avatar.jpg') // Unchanged
      expect(store.isUploading).toBe(false)
    })
  })
})