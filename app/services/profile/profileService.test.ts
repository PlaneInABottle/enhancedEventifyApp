import { supabase } from "@/clients/supabase/SupabaseClient"

import { getUserProfile, updateUserProfile, uploadAvatar } from "./profileService"
import type { UserProfile, UpdateProfileRequest } from "./profileTypes"

// Mock media service
jest.mock("@/services/media/mediaService", () => ({
  uploadMedia: jest.fn(),
  deleteMedia: jest.fn(),
  getMediaForEntity: jest.fn(),
}))

import { uploadMedia, deleteMedia, getMediaForEntity } from "@/services/media/mediaService"

// Mock Supabase client
jest.mock("@/clients/supabase/SupabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}))

const mockSupabase = supabase as any
const mockUploadMedia = uploadMedia as jest.MockedFunction<typeof uploadMedia>
const mockDeleteMedia = deleteMedia as jest.MockedFunction<typeof deleteMedia>
const mockGetMediaForEntity = getMediaForEntity as jest.MockedFunction<typeof getMediaForEntity>

// Helper function to create mock files
function createMockFile(name: string, size: number, type: string): File {
  const file = new File(["mock file content"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("profileService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockProfile: UserProfile = {
    id: "user-123",
    display_name: "John Doe",
    avatar_url: "https://example.com/avatar.jpg",
    bio: "Software developer",
    location_city: "İstanbul",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  }

  // ============================================================================
  // GET USER PROFILE TESTS
  // ============================================================================

  describe("getUserProfile", () => {
    it("should successfully fetch user profile", async () => {
      const mockResponse = { data: mockProfile, error: null }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await getUserProfile("user-123")

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles")
      expect(mockSelect).toHaveBeenCalledWith("*")
      expect(mockEq).toHaveBeenCalledWith("id", "user-123")
      expect(result.success).toBe(true)
      expect(result.profile).toEqual(mockProfile)
    })

    it("should handle profile not found error", async () => {
      const mockError = { status: 404, message: "Not found" }
      const mockResponse = { data: null, error: mockError }
      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const result = await getUserProfile("user-123")

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:profileNotFound")
    })

    it("should handle unexpected errors", async () => {
      const mockSingle = jest.fn().mockRejectedValue(new Error("Network error"))
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const result = await getUserProfile("user-123")

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:unknownError")
    })
  })

  // ============================================================================
  // UPDATE USER PROFILE TESTS
  // ============================================================================

  describe("updateUserProfile", () => {
    it("should successfully update user profile", async () => {
      const updates: UpdateProfileRequest = {
        display_name: "Jane Doe",
        bio: "Senior developer",
      }
      const updatedProfile = { ...mockProfile, ...updates }
      const mockResponse = { data: updatedProfile, error: null }

      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      const result = await updateUserProfile("user-123", updates)

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles")
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "Jane Doe",
          bio: "Senior developer",
          updated_at: expect.any(String),
        }),
      )
      expect(result.success).toBe(true)
      expect(result.profile).toEqual(updatedProfile)
    })

    it("should validate display name and reject invalid names", async () => {
      const updates: UpdateProfileRequest = {
        display_name: "A", // Too short
      }

      const result = await updateUserProfile("user-123", updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:displayNameTooShort")
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it("should validate bio and reject long bios", async () => {
      const updates: UpdateProfileRequest = {
        bio: "A".repeat(501), // Too long
      }

      const result = await updateUserProfile("user-123", updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:bioTooLong")
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it("should format display name properly", async () => {
      const updates: UpdateProfileRequest = {
        display_name: "  John    Doe  ", // Extra spaces
      }
      const updatedProfile = { ...mockProfile, display_name: "John Doe" }
      const mockResponse = { data: updatedProfile, error: null }

      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      const result = await updateUserProfile("user-123", updates)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "John Doe", // Should be formatted
        }),
      )
      expect(result.success).toBe(true)
    })

    it("should handle database errors", async () => {
      const updates: UpdateProfileRequest = { display_name: "John Doe" }
      const mockError = { message: "Database error" }
      const mockResponse = { data: null, error: mockError }

      const mockSingle = jest.fn().mockResolvedValue(mockResponse)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      const result = await updateUserProfile("user-123", updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:unknownError")
    })
  })

  // ============================================================================
  // UPLOAD AVATAR TESTS
  // ============================================================================

  describe("uploadAvatar", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it("should successfully upload avatar", async () => {
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"
      const userId = "user-123"

      // Mock getUserProfile (no existing avatar)
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: userId, avatar_url: null },
            error: null,
          }),
        }),
      })

      // Mock updateUserProfile
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: userId, avatar_url: "https://example.com/avatar.jpg" },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase as any).from = jest.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      })

      // Mock media service - no existing media
      mockGetMediaForEntity.mockResolvedValue({
        success: true,
        media: [],
      })

      // Mock successful media upload
      mockUploadMedia.mockResolvedValue({
        success: true,
        media: {
          id: 'media-id-123',
          entity_id: userId,
          entity_type: 'user',
          file_url: 'https://example.com/avatar.jpg',
          file_type: 'image',
          mime_type: mimeType,
          file_size: 1024 * 1024,
          alt_text: 'User avatar',
          uploaded_by: 'user-id',
          is_active: true,
          entity_exists: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      const result = await uploadAvatar(userId, arrayBuffer, mimeType)

      expect(result.success).toBe(true)
      expect(result.avatarUrl).toBe("https://example.com/avatar.jpg")
      expect(mockUploadMedia).toHaveBeenCalledWith(
        'user',
        userId,
        arrayBuffer,
        mimeType,
        { alt_text: 'User avatar' }
      )
    })

    it("should reject empty file", async () => {
      const emptyBuffer = new ArrayBuffer(0)
      const result = await uploadAvatar("user-123", emptyBuffer, "image/png")

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:invalidFile")
    })

    it("should reject non-image files", async () => {
      const arrayBuffer = new ArrayBuffer(1024)
      const mimeType = "application/pdf"

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:invalidFileType")
      expect(mockUploadMedia).not.toHaveBeenCalled()
    })

    it("should reject files that are too large", async () => {
      const arrayBuffer = new ArrayBuffer(6 * 1024 * 1024) // 6MB
      const mimeType = "image/jpeg"

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:fileTooLarge")
      expect(mockUploadMedia).not.toHaveBeenCalled()
    })

    it("should handle media upload error", async () => {
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const userId = "user-123"

      // Mock getUserProfile
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: userId, avatar_url: null },
            error: null,
          }),
        }),
      })
      ;(mockSupabase as any).from = jest.fn().mockReturnValue({
        select: mockSelect,
      })

      // Mock no existing media
      mockGetMediaForEntity.mockResolvedValue({
        success: true,
        media: [],
      })

      // Mock failed media upload
      mockUploadMedia.mockResolvedValue({
        success: false,
        error: "Storage upload failed"
      })

      const result = await uploadAvatar(userId, arrayBuffer, "image/jpeg")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Storage upload failed")
    })

    it("should delete existing avatar before uploading new one", async () => {
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"
      const userId = "user-123"

      // Mock getUserProfile (existing avatar)
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: userId, avatar_url: 'https://old-avatar.com/old.jpg' },
            error: null,
          }),
        }),
      })

      // Mock updateUserProfile
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: userId, avatar_url: "https://example.com/new-avatar.jpg" },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase as any).from = jest.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      })

      // Mock existing media
      mockGetMediaForEntity.mockResolvedValue({
        success: true,
        media: [
          {
            id: 'old-media-id',
            entity_id: userId,
            entity_type: 'user',
            file_url: 'https://old-avatar.com/old.jpg',
            file_type: 'image',
            mime_type: 'image/jpeg',
            file_size: 512,
            alt_text: 'Old user avatar',
            uploaded_by: 'user-id',
            is_active: true,
            entity_exists: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ],
      })

      // Mock successful delete
      mockDeleteMedia.mockResolvedValue({
        success: true,
      })

      // Mock successful upload
      mockUploadMedia.mockResolvedValue({
        success: true,
        media: {
          id: 'new-media-id',
          entity_id: userId,
          entity_type: 'user',
          file_url: 'https://example.com/new-avatar.jpg',
          file_type: 'image',
          mime_type: mimeType,
          file_size: 1024 * 1024,
          alt_text: 'User avatar',
          uploaded_by: 'user-id',
          is_active: true,
          entity_exists: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      const result = await uploadAvatar(userId, arrayBuffer, mimeType)

      expect(result.success).toBe(true)
      expect(result.avatarUrl).toBe("https://example.com/new-avatar.jpg")
      expect(mockDeleteMedia).toHaveBeenCalledWith('old-media-id')
      expect(mockUploadMedia).toHaveBeenCalled()
    })

    it("should cleanup uploaded file if profile update fails", async () => {
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"
      const userId = "user-123"

      // Mock getUserProfile (no existing avatar)
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: userId, avatar_url: null },
            error: null,
          }),
        }),
      })

      // Mock updateUserProfile failure
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Update failed" },
            }),
          }),
        }),
      })

      ;(mockSupabase as any).from = jest.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      })

      // Mock no existing media
      mockGetMediaForEntity.mockResolvedValue({
        success: true,
        media: [],
      })

      // Mock successful upload but profile update will fail
      mockUploadMedia.mockResolvedValue({
        success: true,
        media: {
          id: 'media-id-123',
          entity_id: userId,
          entity_type: 'user',
          file_url: 'https://example.com/avatar.jpg',
          file_type: 'image',
          mime_type: mimeType,
          file_size: 1024 * 1024,
          alt_text: 'User avatar',
          uploaded_by: 'user-id',
          is_active: true,
          entity_exists: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Mock successful cleanup
      mockDeleteMedia.mockResolvedValue({
        success: true,
      })

      const result = await uploadAvatar(userId, arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(mockDeleteMedia).toHaveBeenCalledWith('media-id-123') // Should cleanup uploaded file
    })
  })
})
