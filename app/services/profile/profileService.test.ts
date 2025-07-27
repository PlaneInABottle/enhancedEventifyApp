import { supabase } from "@/clients/supabase/SupabaseClient"

import { getUserProfile, updateUserProfile, uploadAvatar } from "./profileService"
import type { UserProfile, UpdateProfileRequest } from "./profileTypes"

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
    it("should successfully upload avatar", async () => {
      const mockFile = createMockFile("avatar.jpg", 1024 * 1024, "image/jpeg") // 1MB
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"
      const publicUrl = "https://example.com/avatar.jpg"

      // Mock getUserProfile to return no existing avatar
      const mockProfileResponse = { data: { ...mockProfile, avatar_url: null }, error: null }
      const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse)
      const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock storage upload
      const mockUploadResponse = { data: { path: "user-123-123456789.jpg" }, error: null }
      const mockUpload = jest.fn().mockResolvedValue(mockUploadResponse)
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl } })

      // Mock updateUserProfile
      const mockUpdateResponse = { data: { ...mockProfile, avatar_url: publicUrl }, error: null }
      const mockUpdateSingle = jest.fn().mockResolvedValue(mockUpdateResponse)
      const mockUpdateSelect = jest.fn().mockReturnValue({ single: mockUpdateSingle })
      const mockUpdateEq = jest.fn().mockReturnValue({ select: mockUpdateSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq })

      // Setup mocks step by step
      mockSupabase.from.mockReturnValueOnce({ select: mockProfileSelect })

      // Mock storage.from to return upload and getPublicUrl methods
      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      mockSupabase.from.mockReturnValueOnce({ update: mockUpdate })

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("avatars")
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining("user-123/avatar-"),
        arrayBuffer,
        expect.objectContaining({
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600",
        }),
      )
      expect(result.success).toBe(true)
      expect(result.avatarUrl).toBe(publicUrl)
    })

    it("should reject non-image files", async () => {
      const mockFile = createMockFile("document.pdf", 1024, "application/pdf")
      const arrayBuffer = new ArrayBuffer(1024)
      const mimeType = "application/pdf"

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:invalidFileType")
      expect(mockSupabase.storage.from).not.toHaveBeenCalled()
    })

    it("should reject files that are too large", async () => {
      const mockFile = createMockFile("large-image.jpg", 6 * 1024 * 1024, "image/jpeg") // 6MB
      const arrayBuffer = new ArrayBuffer(6 * 1024 * 1024)
      const mimeType = "image/jpeg"

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:fileTooLarge")
      expect(mockSupabase.storage.from).not.toHaveBeenCalled()
    })

    it("should delete existing avatar before uploading new one", async () => {
      const mockFile = createMockFile("avatar.jpg", 1024 * 1024, "image/jpeg") // 1MB
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"
      const publicUrl = "https://example.com/new-avatar.jpg"
      const existingAvatarUrl =
        "https://example.com/storage/v1/object/public/avatars/user-123/old-avatar-user-123-123456.jpg"

      // Mock getUserProfile to return existing avatar
      const mockProfileResponse = {
        data: { ...mockProfile, avatar_url: existingAvatarUrl },
        error: null,
      }
      const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse)
      const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock storage operations
      const mockUploadResponse = { data: { path: "user-123-987654321.jpg" }, error: null }
      const mockUpload = jest.fn().mockResolvedValue(mockUploadResponse)
      const mockRemove = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl } })

      // Mock updateUserProfile
      const mockUpdateResponse = { data: { ...mockProfile, avatar_url: publicUrl }, error: null }
      const mockUpdateSingle = jest.fn().mockResolvedValue(mockUpdateResponse)
      const mockUpdateSelect = jest.fn().mockReturnValue({ single: mockUpdateSingle })
      const mockUpdateEq = jest.fn().mockReturnValue({ select: mockUpdateSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq })

      // Setup mocks
      mockSupabase.from.mockReturnValueOnce({ select: mockProfileSelect } as any)
      ;(mockSupabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })

      mockSupabase.from.mockReturnValueOnce({ update: mockUpdate } as any)

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(mockRemove).toHaveBeenCalledWith(["user-123/old-avatar-user-123-123456.jpg"])
      expect(result.success).toBe(true)
    })

    it("should handle storage upload errors", async () => {
      const mockFile = createMockFile("avatar.jpg", 1024 * 1024, "image/jpeg") // 1MB
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"

      // Mock getUserProfile to return no existing avatar
      const mockProfileResponse = { data: { ...mockProfile, avatar_url: null }, error: null }
      const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse)
      const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock storage upload error
      const mockUploadError = { code: "EntityTooLarge", message: "File too large" }
      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: mockUploadError })

      // Setup mocks
      mockSupabase.from.mockReturnValueOnce({ select: mockProfileSelect } as any)
      ;(mockSupabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:fileTooLarge") // Should map EntityTooLarge to fileTooLarge
    })

    it("should handle generic storage upload errors", async () => {
      const mockFile = createMockFile("avatar.jpg", 1024 * 1024, "image/jpeg") // 1MB
      const arrayBuffer = new ArrayBuffer(1024 * 1024)
      const mimeType = "image/jpeg"

      // Mock getUserProfile to return no existing avatar
      const mockProfileResponse = { data: { ...mockProfile, avatar_url: null }, error: null }
      const mockProfileSingle = jest.fn().mockResolvedValue(mockProfileResponse)
      const mockProfileEq = jest.fn().mockReturnValue({ single: mockProfileSingle })
      const mockProfileSelect = jest.fn().mockReturnValue({ eq: mockProfileEq })

      // Mock storage upload error
      const mockUploadError = { code: "StorageError", message: "Storage service unavailable" }
      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: mockUploadError })

      // Setup mocks
      mockSupabase.from.mockReturnValueOnce({ select: mockProfileSelect } as any)
      ;(mockSupabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      const result = await uploadAvatar("user-123", arrayBuffer, mimeType)

      expect(result.success).toBe(false)
      expect(result.error).toBe("errors:uploadFailed") // Should map other errors to uploadFailed
    })
  })
})
