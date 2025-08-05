import { supabase } from "@/clients/supabase/SupabaseClient"

import { getVenueById, getVenuesByBusiness, createVenue } from "./venueService"

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
    })),
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
      error: "Database connection failed",
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

    // Setup mock return value
    const mockOrder = jest.fn().mockResolvedValue({ data: mockVenues, error: null })
    const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder })
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    // Execute the function
    const result = await getVenuesByBusiness("business-1")

    // Assertions
    expect(mockSupabase.from).toHaveBeenCalledWith("venues")
    expect(mockSelect).toHaveBeenCalledWith(`
        *,
        address:addresses(*)
      `)
    expect(mockEq1).toHaveBeenCalledWith("business_id", "business-1")
    expect(mockEq2).toHaveBeenCalledWith("is_active", true)
    expect(mockOrder).toHaveBeenCalledWith("name")

    expect(result).toEqual({
      success: true,
      venues: mockVenues,
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

// TODO: Add updateVenue and deleteVenue tests next
// BREADCRUMB: Completed createVenue success test case
