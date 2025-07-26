import { BusinessProfileStore } from './BusinessProfileStore'
import { getBusinessProfile, updateBusinessProfile, uploadLogo } from '@/services/businessProfile/businessProfileService'

// Mock the service
jest.mock('@/services/businessProfile/businessProfileService', () => ({
  getBusinessProfile: jest.fn(),
  updateBusinessProfile: jest.fn(),
  uploadLogo: jest.fn(),
}))

describe('BusinessProfileStore', () => {
  let store: typeof BusinessProfileStore.Type

  beforeEach(() => {
    store = BusinessProfileStore.create()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(store.profile).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isUpdating).toBe(false)
      expect(store.isUploading).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it('should have correct computed views for empty profile', () => {
      expect(store.hasProfile).toBe(false)
      expect(store.businessName).toBeNull()
      expect(store.businessTypes).toEqual([])
      expect(store.description).toBeNull()
      expect(store.phone).toBeNull()
      expect(store.websiteUrl).toBeNull()
      expect(store.logoUrl).toBeNull()
      expect(store.businessStatus).toBe('pending')
    })
  })

  describe('fetchProfile action', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should fetch business profile successfully', async () => {
      const mockProfile = {
        id: 'test-id',
        business_name: 'Test Business',
        business_types: ['restaurant'],
        description: 'A test business',
        phone: '+90 555 123 4567',
        website_url: 'https://example.com',
        logo_url: null,
        business_status: 'verified',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      ;(getBusinessProfile as jest.Mock).mockResolvedValue({
        success: true,
        profile: mockProfile
      })

      await store.fetchProfile('test-id')

      expect(store.profile).toEqual(mockProfile)
      expect(store.hasProfile).toBe(true)
      expect(store.businessName).toBe('Test Business')
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it('should handle service error during fetch', async () => {
      ;(getBusinessProfile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Profile not found'
      })

      await store.fetchProfile('invalid-id')

      expect(store.profile).toBeNull()
      expect(store.hasProfile).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe('Profile not found')
    })

    it('should handle unexpected error during fetch', async () => {
      ;(getBusinessProfile as jest.Mock).mockRejectedValue(new Error('Network error'))

      await store.fetchProfile('test-id')

      expect(store.profile).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe('errors:businessProfile.fetchUnexpected')
    })
  })

  describe('updateProfile action', () => {
    it('should update business profile successfully', async () => {
      const updatedProfile = {
        id: 'test-id',
        business_name: 'Updated Business',
        business_types: ['cafe'],
        description: 'Updated description',
        phone: '+90 555 999 8888',
        website_url: 'https://updated.com',
        logo_url: null,
        business_status: 'verified',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      }

      ;(updateBusinessProfile as jest.Mock).mockResolvedValue({
        success: true,
        profile: updatedProfile
      })

      await store.updateProfile('test-id', { business_name: 'Updated Business' })

      expect(store.profile).toEqual(updatedProfile)
      expect(store.businessName).toBe('Updated Business')
      expect(store.isUpdating).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it('should handle service error during update', async () => {
      ;(updateBusinessProfile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Update permission denied'
      })

      await store.updateProfile('test-id', { business_name: 'New Name' })

      expect(store.isUpdating).toBe(false)
      expect(store.lastError).toBe('Update permission denied')
    })
  })

  describe('uploadLogo action', () => {
    it('should upload logo successfully when profile exists', async () => {
      // Set up initial profile
      const initialProfile = {
        id: 'test-id',
        business_name: 'Test Business',
        business_types: ['restaurant'],
        description: null,
        phone: null,
        website_url: null,
        logo_url: null,
        business_status: 'verified',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
      store.setProp('profile', initialProfile)

      ;(uploadLogo as jest.Mock).mockResolvedValue({
        success: true,
        logoUrl: 'https://example.com/new-logo.png'
      })

      const mockBuffer = new ArrayBuffer(1024)
      await store.uploadLogo('test-id', mockBuffer, 'image/png')

      expect(store.logoUrl).toBe('https://example.com/new-logo.png')
      expect(store.isUploading).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it('should handle service error during upload', async () => {
      ;(uploadLogo as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Upload failed'
      })

      const mockBuffer = new ArrayBuffer(1024)
      await store.uploadLogo('test-id', mockBuffer, 'image/png')

      expect(store.isUploading).toBe(false)
      expect(store.lastError).toBe('Upload failed')
    })

    it('should handle upload when no profile exists', async () => {
      // Ensure no profile is set
      store.setProp('profile', null)

      ;(uploadLogo as jest.Mock).mockResolvedValue({
        success: true,
        logoUrl: 'https://example.com/logo.png'
      })

      const mockBuffer = new ArrayBuffer(1024)
      await store.uploadLogo('test-id', mockBuffer, 'image/png')

      expect(store.profile).toBeNull()
      expect(store.logoUrl).toBeNull()
      expect(store.isUploading).toBe(false)
      expect(store.lastError).toBe('errors:businessProfile.uploadFailed')
    })
  })
})