import { supabase } from "@/clients/supabase/SupabaseClient"
import type { TurkishCity } from "@/services/profile/profileTypes"

import { getVenueById, getVenuesByBusiness, createVenue, updateVenue, deleteVenue } from "./venueService"

// Mock Supabase client
jest.mock("@/clients/supabase/SupabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
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
    rpc: jest.fn(),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe("getVenueById", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch venue with address successfully", async () => {
    const mockVenue = {
      id: "venue-1",
      business_id: "business-1",
      address_id: "address-1",
      name: "Test Venue",
      description: "A test venue",
      capacity: 100,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      address: {
        id: "address-1",
        full_address: "Test Address",
        city: "İstanbul",
        country: "Turkey",
        postal_code: "34000",
        coordinates: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    }

    // Setup mock return value
    const mockChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    // Execute the function
    const result = await getVenueById("venue-1")

    // Assertions
    expect(mockSupabase.from).toHaveBeenCalledWith("venues")
    expect(mockSelect).toHaveBeenCalledWith(`
        *,
        address:addresses(*)
      `)
    expect(mockEq).toHaveBeenCalledWith("id", "venue-1")
    expect(mockChain.single).toHaveBeenCalled()

    expect(result).toEqual({
      success: true,
      venue: mockVenue,
    })
  })

  it("should handle database error", async () => {
    const mockError = { message: "Database connection failed" }

    // Setup mock to return error
    const mockChain = {
      single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    // Execute the function
    const result = await getVenueById("venue-1")

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:fetchVenueFailed",
    })
  })
})

describe("getVenuesByBusiness", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch venues for business successfully", async () => {
    const mockVenues = [
      {
        id: "venue-1",
        business_id: "business-1",
        address_id: "address-1",
        name: "Test Venue 1",
        description: "First test venue",
        capacity: 100,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        address: {
          id: "address-1",
          full_address: "Test Address 1",
          city: "İstanbul",
          country: "Turkey",
          postal_code: "34000",
          coordinates: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      },
    ]

    // Setup mock for RPC call
    mockSupabase.rpc.mockResolvedValue({ 
      data: mockVenues, 
      error: null, 
      count: null,
      status: 200,
      statusText: 'OK'
    })

    // Execute the function
    const result = await getVenuesByBusiness("business-1")

    // Assertions
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_venues_by_business", {
      business_id_param: "business-1",
    })

    expect(result).toEqual({
      success: true,
      venues: mockVenues,
    })
  })

  it("should handle RPC error", async () => {
    // Setup mock for RPC error
    mockSupabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { 
        message: "RPC failed",
        details: "Table not found",
        hint: "Check table name",
        code: "42P01",
        name: "PostgrestError"
      }, 
      count: null,
      status: 400,
      statusText: 'Bad Request'
    })

    // Execute the function
    const result = await getVenuesByBusiness("business-1")

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:fetchVenueFailed",
    })
  })

  it("should handle RPC exception", async () => {
    // Setup mock to throw exception
    mockSupabase.rpc.mockRejectedValue(new Error("Network error"))

    // Execute the function
    const result = await getVenuesByBusiness("business-1")

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:fetchVenueFailed",
    })
  })
})

describe("createVenue", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create venue with address successfully", async () => {
    const mockAddress = {
      id: "address-1",
      full_address: "Test Address",
      city: "İstanbul",
      country: "Turkey",
      postal_code: "34000",
      coordinates: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    }

    const mockVenue = {
      id: "venue-1",
      business_id: "business-1",
      address_id: "address-1",
      name: "Test Venue",
      description: "A test venue",
      capacity: 100,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      address: mockAddress,
    }

    // Setup mock for address creation
    const mockAddressChain = {
      single: jest.fn().mockResolvedValue({ data: mockAddress, error: null }),
    }
    const mockAddressSelect = jest.fn().mockReturnValue(mockAddressChain)
    const mockAddressInsert = jest.fn().mockReturnValue({ select: mockAddressSelect })

    // Setup mock for venue creation
    const mockVenueChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockVenueSelect = jest.fn().mockReturnValue(mockVenueChain)
    const mockVenueInsert = jest.fn().mockReturnValue({ select: mockVenueSelect })

    // Configure from method to return different mocks based on table
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "addresses") {
        return { insert: mockAddressInsert } as any
      } else if (table === "venues") {
        return { insert: mockVenueInsert } as any
      }
      return {} as any
    })

    const venueData = {
      name: "Test Venue",
      description: "A test venue",
      capacity: 100,
      address: {
        full_address: "Test Address",
        city: "İstanbul" as const,
        country: "Turkey",
        postal_code: "34000",
      },
    }

    // Execute the function
    const result = await createVenue("business-1", venueData)

    // Assertions
    expect(mockSupabase.from).toHaveBeenCalledWith("addresses")
    expect(mockAddressInsert).toHaveBeenCalledWith({
      full_address: "Test Address",
      city: "İstanbul",
      country: "Turkey",
      postal_code: "34000",
      coordinates: null,
    })
    expect(mockAddressSelect).toHaveBeenCalled()
    expect(mockAddressChain.single).toHaveBeenCalled()

    expect(mockSupabase.from).toHaveBeenCalledWith("venues")
    expect(mockVenueInsert).toHaveBeenCalledWith({
      business_id: "business-1",
      address_id: "address-1",
      name: "Test Venue",
      description: "A test venue",
      capacity: 100,
    })
    expect(mockVenueSelect).toHaveBeenCalledWith(`
        *,
        address:addresses(*)
      `)
    expect(mockVenueChain.single).toHaveBeenCalled()

    expect(result).toEqual({
      success: true,
      venue: mockVenue,
    })
  })
})

describe("updateVenue", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockVenue = {
    id: "venue-1",
    business_id: "business-1",
    address_id: "address-1",
    name: "Updated Venue",
    description: "Updated description",
    capacity: 150,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    address: {
      id: "address-1",
      full_address: "456 Updated Street",
      city: "Ankara",
      country: "Turkey",
      postal_code: "06000",
      coordinates: {
        type: "Point" as const,
        coordinates: [32.0, 39.0] as [number, number],
      },
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  }

  it("should update venue with address successfully", async () => {
    const updateData = {
      name: "Updated Venue",
      description: "Updated description",
      capacity: 150,
      address: {
        full_address: "456 Updated Street",
        city: "Ankara" as TurkishCity,
        postal_code: "06000",
        coordinates: {
          type: "Point" as const,
          coordinates: [32.0, 39.0] as [number, number],
        },
      },
    }

    // Setup mock for getting venue address_id
    const mockVenueChain = {
      single: jest.fn().mockResolvedValue({ 
        data: { address_id: "address-1" }, 
        error: null 
      }),
    }
    const mockVenueEq = jest.fn().mockReturnValue(mockVenueChain)
    const mockVenueSelect = jest.fn().mockReturnValue({ eq: mockVenueEq })

    // Setup mock for address update
    const mockAddressUpdate = {
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    const mockAddressUpdateFn = jest.fn().mockReturnValue(mockAddressUpdate)

    // Setup mock for venue update
    const mockVenueUpdateChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockVenueUpdateSelect = jest.fn().mockReturnValue(mockVenueUpdateChain)
    const mockVenueUpdateEq = jest.fn().mockReturnValue({ select: mockVenueUpdateSelect })
    const mockVenueUpdateFn = jest.fn().mockReturnValue({ eq: mockVenueUpdateEq })

    // Configure from method to return different mocks based on table and operation
    let callCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      callCount++
      if (table === "venues" && callCount === 1) {
        // First call - get venue address_id
        return { select: mockVenueSelect } as any
      } else if (table === "addresses") {
        // Second call - update address
        return { update: mockAddressUpdateFn } as any
      } else if (table === "venues" && callCount === 3) {
        // Third call - update venue
        return { update: mockVenueUpdateFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await updateVenue("venue-1", updateData)

    // Assertions for venue address_id fetch
    expect(mockVenueSelect).toHaveBeenCalledWith("address_id")
    expect(mockVenueEq).toHaveBeenCalledWith("id", "venue-1")
    expect(mockVenueChain.single).toHaveBeenCalled()

    // Assertions for address update
    expect(mockAddressUpdateFn).toHaveBeenCalledWith({
      full_address: "456 Updated Street",
      city: "Ankara",
      postal_code: "06000",
      country: null,
      coordinates: "Point(32 39)",
    })
    expect(mockAddressUpdate.eq).toHaveBeenCalledWith("id", "address-1")

    // Assertions for venue update
    expect(mockVenueUpdateFn).toHaveBeenCalledWith({
      name: "Updated Venue",
      description: "Updated description", 
      capacity: 150,
    })
    expect(mockVenueUpdateEq).toHaveBeenCalledWith("id", "venue-1")
    expect(mockVenueUpdateSelect).toHaveBeenCalledWith(`
        *,
        address:addresses(*)
      `)
    expect(mockVenueUpdateChain.single).toHaveBeenCalled()

    expect(result).toEqual({
      success: true,
      venue: mockVenue,
    })
  })

  it("should update venue without address", async () => {
    const updateData = {
      name: "Updated Venue",
      capacity: 200,
    }

    // Setup mock for venue update only (no address update)
    const mockVenueUpdateChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockVenueUpdateSelect = jest.fn().mockReturnValue(mockVenueUpdateChain)
    const mockVenueUpdateEq = jest.fn().mockReturnValue({ select: mockVenueUpdateSelect })
    const mockVenueUpdateFn = jest.fn().mockReturnValue({ eq: mockVenueUpdateEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { update: mockVenueUpdateFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await updateVenue("venue-1", updateData)

    // Assertions
    expect(mockVenueUpdateFn).toHaveBeenCalledWith({
      name: "Updated Venue",
      capacity: 200,
    })
    expect(mockVenueUpdateEq).toHaveBeenCalledWith("id", "venue-1")

    expect(result).toEqual({
      success: true,
      venue: mockVenue,
    })
  })

  it("should handle address update error", async () => {
    const updateData = {
      name: "Updated Venue",
      address: {
        full_address: "456 Updated Street",
        city: "Ankara" as TurkishCity,
      },
    }

    // Setup mock for getting venue address_id
    const mockVenueChain = {
      single: jest.fn().mockResolvedValue({ 
        data: { address_id: "address-1" }, 
        error: null 
      }),
    }
    const mockVenueEq = jest.fn().mockReturnValue(mockVenueChain)
    const mockVenueSelect = jest.fn().mockReturnValue({ eq: mockVenueEq })

    // Setup mock for address update error
    const mockAddressUpdate = {
      eq: jest.fn().mockResolvedValue({ error: { message: "Address update failed" } }),
    }
    const mockAddressUpdateFn = jest.fn().mockReturnValue(mockAddressUpdate)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { select: mockVenueSelect } as any
      } else if (table === "addresses") {
        return { update: mockAddressUpdateFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await updateVenue("venue-1", updateData)

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:createAddressFailed",
    })
  })

  it("should handle venue update error", async () => {
    const updateData = {
      name: "Updated Venue",
    }

    // Setup mock for venue update error
    const mockVenueUpdateChain = {
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Update failed" } }),
    }
    const mockVenueUpdateSelect = jest.fn().mockReturnValue(mockVenueUpdateChain)
    const mockVenueUpdateEq = jest.fn().mockReturnValue({ select: mockVenueUpdateSelect })
    const mockVenueUpdateFn = jest.fn().mockReturnValue({ eq: mockVenueUpdateEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { update: mockVenueUpdateFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await updateVenue("venue-1", updateData)

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:updateVenueFailed",
    })
  })

  it("should handle service exception", async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error("Database connection failed")
    })

    // Execute the function
    const result = await updateVenue("venue-1", { name: "Test" })

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:updateVenueFailed",
    })
  })
})

describe("deleteVenue", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockVenue = {
    id: "venue-1",
    business_id: "business-1",
    address_id: "address-1",
    name: "Test Venue",
    description: "A test venue",
    capacity: 100,
    is_active: false, // Should be false after soft delete
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    address: {
      id: "address-1",
      full_address: "Test Address",
      city: "İstanbul",
      country: "Turkey",
      postal_code: "34000",
      coordinates: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  }

  it("should soft delete venue successfully", async () => {
    // Setup mock for venue soft delete
    const mockVenueDeleteChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockVenueDeleteSelect = jest.fn().mockReturnValue(mockVenueDeleteChain)
    const mockVenueDeleteEq = jest.fn().mockReturnValue({ select: mockVenueDeleteSelect })
    const mockVenueDeleteFn = jest.fn().mockReturnValue({ eq: mockVenueDeleteEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { update: mockVenueDeleteFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await deleteVenue("venue-1")

    // Assertions
    expect(mockSupabase.from).toHaveBeenCalledWith("venues")
    expect(mockVenueDeleteFn).toHaveBeenCalledWith({ is_active: false })
    expect(mockVenueDeleteEq).toHaveBeenCalledWith("id", "venue-1")
    expect(mockVenueDeleteSelect).toHaveBeenCalledWith(`
        *,
        address:addresses(*)
      `)
    expect(mockVenueDeleteChain.single).toHaveBeenCalled()

    expect(result).toEqual({
      success: true,
      venue: mockVenue,
    })
  })

  it("should handle delete error", async () => {
    // Setup mock for venue delete error
    const mockVenueDeleteChain = {
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Delete failed" } }),
    }
    const mockVenueDeleteSelect = jest.fn().mockReturnValue(mockVenueDeleteChain)
    const mockVenueDeleteEq = jest.fn().mockReturnValue({ select: mockVenueDeleteSelect })
    const mockVenueDeleteFn = jest.fn().mockReturnValue({ eq: mockVenueDeleteEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { update: mockVenueDeleteFn } as any
      }
      return {} as any
    })

    // Execute the function
    const result = await deleteVenue("venue-1")

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:deleteVenueFailed",
    })
  })

  it("should handle service exception", async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error("Database connection failed")
    })

    // Execute the function
    const result = await deleteVenue("venue-1")

    // Assertions
    expect(result).toEqual({
      success: false,
      error: "errors:deleteVenueFailed",
    })
  })

  it("should be idempotent (multiple calls on same venue)", async () => {
    // Setup mock for successful soft delete
    const mockVenueDeleteChain = {
      single: jest.fn().mockResolvedValue({ data: mockVenue, error: null }),
    }
    const mockVenueDeleteSelect = jest.fn().mockReturnValue(mockVenueDeleteChain)
    const mockVenueDeleteEq = jest.fn().mockReturnValue({ select: mockVenueDeleteSelect })
    const mockVenueDeleteFn = jest.fn().mockReturnValue({ eq: mockVenueDeleteEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "venues") {
        return { update: mockVenueDeleteFn } as any
      }
      return {} as any
    })

    // Execute the function multiple times
    const result1 = await deleteVenue("venue-1")
    const result2 = await deleteVenue("venue-1")

    // Both calls should succeed
    expect(result1).toEqual({
      success: true,
      venue: mockVenue,
    })
    expect(result2).toEqual({
      success: true,
      venue: mockVenue,
    })

    // Verify both calls made the same update
    expect(mockVenueDeleteFn).toHaveBeenCalledTimes(2)
    expect(mockVenueDeleteFn).toHaveBeenNthCalledWith(1, { is_active: false })
    expect(mockVenueDeleteFn).toHaveBeenNthCalledWith(2, { is_active: false })
  })
})

// BREADCRUMB: Completed comprehensive updateVenue and deleteVenue test coverage
