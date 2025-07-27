import { supabase } from "@/clients/supabase/SupabaseClient"

import { getBusinessProfile, updateBusinessProfile, uploadLogo } from "./businessProfileService"

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

    const mockUpload = jest.fn().mockResolvedValue({
      data: { path: "test-business-id/business-logo-123456.png" },
      error: null,
    })
    const mockGetPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: "https://example.com/logo.png" },
    })
    const mockRemove = jest.fn().mockResolvedValue({ data: null, error: null })

    const mockStorageFrom = jest.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    })

    ;(mockSupabase as any).from = jest.fn().mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })
    ;(mockSupabase.storage as any).from = mockStorageFrom

    const result = await uploadLogo(businessId, mockArrayBuffer, mimeType)

    expect(result.success).toBe(true)
    expect(result.logoUrl).toBe("https://example.com/logo.png")
    expect(mockStorageFrom).toHaveBeenCalledWith("avatars")
  })

  it("should reject invalid file", async () => {
    const emptyBuffer = new ArrayBuffer(0)
    const result = await uploadLogo("test-id", emptyBuffer, "image/png")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileEmpty")
  })

  it("should handle storage upload error", async () => {
    const mockArrayBuffer = new ArrayBuffer(1024)
    const mockUpload = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Storage upload failed" },
    })
    ;(mockSupabase.storage as any).from = jest.fn().mockReturnValue({
      upload: mockUpload,
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
})
