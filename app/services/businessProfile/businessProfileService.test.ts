import { supabase } from "@/clients/supabase/SupabaseClient"

import { getBusinessProfile, updateBusinessProfile, uploadLogo } from "./businessProfileService"

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
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockUploadMedia = uploadMedia as jest.MockedFunction<typeof uploadMedia>
const mockDeleteMedia = deleteMedia as jest.MockedFunction<typeof deleteMedia>
const mockGetMediaForEntity = getMediaForEntity as jest.MockedFunction<typeof getMediaForEntity>

describe("getBusinessProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch business profile successfully", async () => {
    const mockProfile = {
      id: "test-id",
      business_name: "Test Business",
      business_types: ["restaurant"],
      description: "A test business",
      phone: "+90 555 123 4567",
      website_url: "https://example.com",
      logo_url: null,
      business_status: "verified",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    }

    // Setup mock return value
    const mockChain = {
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const result = await getBusinessProfile("test-id")

    expect(result.success).toBe(true)
    expect(result.profile).toEqual(mockProfile)
    expect(mockSupabase.from).toHaveBeenCalledWith("business_profiles")
  })

  it("should handle database error", async () => {
    const mockChain = {
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Record not found" },
      }),
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const result = await getBusinessProfile("invalid-id")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Record not found")
  })

  it("should handle unexpected errors during fetch", async () => {
    const mockChain = {
      single: jest.fn().mockRejectedValue(new Error("Network error")),
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const result = await getBusinessProfile("test-id")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unexpected error fetching business profile")
  })
})

describe("updateBusinessProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should update business profile successfully", async () => {
    const updatedProfile = {
      id: "test-id",
      business_name: "Updated Business",
      business_types: ["cafe"],
      description: "Updated description",
      phone: "+90 555 999 8888",
      website_url: "https://updated.com",
      logo_url: null,
      business_status: "verified",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-02T00:00:00Z",
    }

    const mockChain = {
      single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null }),
    }
    const mockSelect = jest.fn().mockReturnValue(mockChain)
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

    const updates = { business_name: "Updated Business", description: "Updated description" }
    const result = await updateBusinessProfile("test-id", updates)

    expect(result.success).toBe(true)
    expect(result.profile).toEqual(updatedProfile)
    expect(mockUpdate).toHaveBeenCalledWith(updates)
  })

  it("should handle database error during update", async () => {
    const mockChain = {
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      }),
    }
    const mockSelect = jest.fn().mockReturnValue(mockChain)
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

    const result = await updateBusinessProfile("test-id", { business_name: "New Name" })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Update failed")
  })
})

describe("uploadLogo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should upload logo successfully", async () => {
    const mockArrayBuffer = new ArrayBuffer(1024)
    const mimeType = "image/png"
    const businessId = "test-business-id"

    // Mock getBusinessProfile (no existing logo)
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: businessId, logo_url: null },
          error: null,
        }),
      }),
    })

    // Mock updateBusinessProfile
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: businessId, logo_url: "https://example.com/logo.png" },
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
        entity_id: businessId,
        entity_type: 'business',
        file_url: 'https://example.com/logo.png',
        file_type: 'image',
        mime_type: mimeType,
        file_size: 1024,
        alt_text: 'Business logo',
        uploaded_by: 'user-id',
        is_active: true,
        entity_exists: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })

    const result = await uploadLogo(businessId, mockArrayBuffer, mimeType)

    expect(result.success).toBe(true)
    expect(result.logoUrl).toBe("https://example.com/logo.png")
    expect(mockUploadMedia).toHaveBeenCalledWith(
      'business',
      businessId,
      mockArrayBuffer,
      mimeType,
      { alt_text: 'Business logo' }
    )
  })

  it("should reject invalid file", async () => {
    const emptyBuffer = new ArrayBuffer(0)
    const result = await uploadLogo("test-id", emptyBuffer, "image/png")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileEmpty")
  })

  it("should handle media upload error", async () => {
    const mockArrayBuffer = new ArrayBuffer(1024)

    // Mock getBusinessProfile
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', logo_url: null },
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

    const result = await uploadLogo("test-id", mockArrayBuffer, "image/png")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Storage upload failed")
  })

  it("should reject invalid mime type", async () => {
    const mockArrayBuffer = new ArrayBuffer(1024)
    const result = await uploadLogo("test-id", mockArrayBuffer, "application/pdf")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileNotImage")
  })

  it("should reject file exceeding 5MB limit", async () => {
    const largeBuffer = new ArrayBuffer(6 * 1024 * 1024) // 6MB
    const result = await uploadLogo("test-id", largeBuffer, "image/png")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileTooLarge")
  })

  it("should delete existing logo before uploading new one", async () => {
    const mockArrayBuffer = new ArrayBuffer(1024)
    const mimeType = "image/png"
    const businessId = "test-business-id"

    // Mock getBusinessProfile (existing logo)
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: businessId, logo_url: 'https://old-logo.com/old.png' },
          error: null,
        }),
      }),
    })

    // Mock updateBusinessProfile
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: businessId, logo_url: "https://example.com/new-logo.png" },
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
          entity_id: businessId,
          entity_type: 'business',
          file_url: 'https://old-logo.com/old.png',
          file_type: 'image',
          mime_type: 'image/png',
          file_size: 512,
          alt_text: 'Old business logo',
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
        entity_id: businessId,
        entity_type: 'business',
        file_url: 'https://example.com/new-logo.png',
        file_type: 'image',
        mime_type: mimeType,
        file_size: 1024,
        alt_text: 'Business logo',
        uploaded_by: 'user-id',
        is_active: true,
        entity_exists: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })

    const result = await uploadLogo(businessId, mockArrayBuffer, mimeType)

    expect(result.success).toBe(true)
    expect(result.logoUrl).toBe("https://example.com/new-logo.png")
    expect(mockDeleteMedia).toHaveBeenCalledWith('old-media-id')
    expect(mockUploadMedia).toHaveBeenCalled()
  })
})
