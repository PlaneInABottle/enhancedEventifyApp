import { VenueStore } from "./VenueStore"
import * as venueService from "@/services/venue/venueService"

// Mock the venue service
jest.mock("@/services/venue/venueService", () => ({
  getVenuesByBusiness: jest.fn(),
  createVenue: jest.fn(),
  updateVenue: jest.fn(),
  deleteVenue: jest.fn(),
}))

const mockVenueService = venueService as jest.Mocked<typeof venueService>

describe("VenueStore", () => {
  let store: any

  beforeEach(() => {
    jest.clearAllMocks()
    store = VenueStore.create({})
  })

  describe("Initial State", () => {
    it("should initialize with empty state", () => {
      expect(store.venues).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it("should have correct computed values for empty state", () => {
      expect(store.venueCount).toBe(0)
      expect(store.activeVenueCount).toBe(0)
      expect(store.hasVenues).toBe(false)
      expect(store.hasActiveVenues).toBe(false)
      expect(store.activeVenues).toEqual([])
    })
  })

  describe("Computed Views", () => {
    const mockVenues = [
      {
        id: "venue-1",
        business_id: "business-1",
        address_id: "address-1",
        name: "Active Venue 1",
        description: "First active venue",
        capacity: 100,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        address: {
          id: "address-1",
          full_address: "Test Address 1",
          city: "İstanbul" as const,
          country: "Turkey",
          postal_code: "34000",
          coordinates: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      },
      {
        id: "venue-2",
        business_id: "business-1",
        address_id: "address-2",
        name: "Inactive Venue",
        description: "Inactive venue",
        capacity: 50,
        is_active: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        address: null,
      },
      {
        id: "venue-3",
        business_id: "business-1",
        address_id: "address-3",
        name: "Active Venue 2",
        description: "Second active venue",
        capacity: 200,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        address: null,
      },
    ]

    beforeEach(() => {
      store.setVenues(mockVenues)
    })

    it("should calculate venue counts correctly", () => {
      expect(store.venueCount).toBe(3)
      expect(store.activeVenueCount).toBe(2)
    })

    it("should filter active venues correctly", () => {
      const activeVenues = store.activeVenues
      expect(activeVenues).toHaveLength(2)
      expect(activeVenues[0].name).toBe("Active Venue 1")
      expect(activeVenues[1].name).toBe("Active Venue 2")
    })

    it("should determine venue existence correctly", () => {
      expect(store.hasVenues).toBe(true)
      expect(store.hasActiveVenues).toBe(true)
    })

    it("should handle empty venue list", () => {
      store.setVenues([])
      expect(store.hasVenues).toBe(false)
      expect(store.hasActiveVenues).toBe(false)
      expect(store.activeVenues).toEqual([])
    })
  })

  describe("Utility Actions", () => {
    const sampleVenue = {
      id: "venue-1",
      business_id: "business-1",
      address_id: "address-1",
      name: "Test Venue",
      description: "A test venue",
      capacity: 100,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      address: null,
    }

    it("should clear error state", () => {
      store.setProp("lastError", "Test error")
      expect(store.lastError).toBe("Test error")
      
      store.clearError()
      expect(store.lastError).toBeNull()
    })

    it("should set venues array", () => {
      const venues = [sampleVenue]
      store.setVenues(venues)
      expect(store.venues).toEqual(venues)
      expect(store.venueCount).toBe(1)
    })

    it("should add venue to store", () => {
      expect(store.venueCount).toBe(0)
      
      store.addVenue(sampleVenue)
      expect(store.venueCount).toBe(1)
      expect(store.venues[0]).toEqual(sampleVenue)
    })

    it("should update venue in store", () => {
      store.addVenue(sampleVenue)
      
      const updatedVenue = { ...sampleVenue, name: "Updated Venue" }
      store.updateVenueInStore("venue-1", updatedVenue)
      
      expect(store.venues[0].name).toBe("Updated Venue")
    })

    it("should not update non-existent venue", () => {
      store.addVenue(sampleVenue)
      
      const updatedVenue = { ...sampleVenue, name: "Updated Venue" }
      store.updateVenueInStore("non-existent", updatedVenue)
      
      expect(store.venues[0].name).toBe("Test Venue") // Unchanged
    })

    it("should remove venue from store", () => {
      store.addVenue(sampleVenue)
      expect(store.venueCount).toBe(1)
      
      store.removeVenueFromStore("venue-1")
      expect(store.venueCount).toBe(0)
    })

    it("should not remove non-existent venue", () => {
      store.addVenue(sampleVenue)
      expect(store.venueCount).toBe(1)
      
      store.removeVenueFromStore("non-existent")
      expect(store.venueCount).toBe(1) // Unchanged
    })
  })

  describe("Async Flow Actions", () => {
    const sampleVenue = {
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
        city: "İstanbul" as const,
        country: "Turkey",
        postal_code: "34000",
        coordinates: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    }

    describe("fetchVenuesByBusiness", () => {
      it("should fetch venues successfully", async () => {
        const mockVenues = [sampleVenue]
        mockVenueService.getVenuesByBusiness.mockResolvedValue({
          success: true,
          venues: mockVenues,
        })

        await store.fetchVenuesByBusiness("business-1")

        expect(mockVenueService.getVenuesByBusiness).toHaveBeenCalledWith("business-1")
        expect(store.venues).toEqual(mockVenues)
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBeNull()
      })

      it("should handle fetch error", async () => {
        mockVenueService.getVenuesByBusiness.mockResolvedValue({
          success: false,
          error: "errors.fetchVenuesFailed",
        })

        await store.fetchVenuesByBusiness("business-1")

        expect(store.venues).toEqual([])
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.fetchVenuesFailed")
      })

      it("should handle service exception", async () => {
        mockVenueService.getVenuesByBusiness.mockRejectedValue(new Error("Network error"))

        await store.fetchVenuesByBusiness("business-1")

        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.fetchVenuesFailed")
      })
    })

    describe("createVenue", () => {
      const venueData = {
        name: "New Venue",
        description: "A new venue",
        capacity: 150,
        address: {
          full_address: "New Address",
          city: "Ankara" as const,
          country: "Turkey",
          postal_code: "06000",
        },
      }

      it("should create venue successfully", async () => {
        mockVenueService.createVenue.mockResolvedValue({
          success: true,
          venue: sampleVenue,
        })

        const result = await store.createVenue("business-1", venueData)

        expect(mockVenueService.createVenue).toHaveBeenCalledWith("business-1", venueData)
        expect(store.venues).toContainEqual(sampleVenue)
        expect(store.venueCount).toBe(1)
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBeNull()
        expect(result).toEqual(sampleVenue)
      })

      it("should handle create error", async () => {
        mockVenueService.createVenue.mockResolvedValue({
          success: false,
          error: "errors.createVenueFailed",
        })

        const result = await store.createVenue("business-1", venueData)

        expect(store.venueCount).toBe(0)
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.createVenueFailed")
        expect(result).toBeNull()
      })

      it("should handle create exception", async () => {
        mockVenueService.createVenue.mockRejectedValue(new Error("Network error"))

        const result = await store.createVenue("business-1", venueData)

        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.createVenueFailed")
        expect(result).toBeNull()
      })
    })

    describe("updateVenue", () => {
      const updateData = {
        name: "Updated Venue",
        capacity: 120,
      }

      beforeEach(() => {
        store.addVenue(sampleVenue)
      })

      it("should update venue successfully", async () => {
        const updatedVenue = { ...sampleVenue, ...updateData }
        mockVenueService.updateVenue.mockResolvedValue({
          success: true,
          venue: updatedVenue,
        })

        const result = await store.updateVenue("venue-1", updateData)

        expect(mockVenueService.updateVenue).toHaveBeenCalledWith("venue-1", updateData)
        expect(store.venues[0].name).toBe("Updated Venue")
        expect(store.venues[0].capacity).toBe(120)
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBeNull()
        expect(result).toEqual(updatedVenue)
      })

      it("should handle update error", async () => {
        mockVenueService.updateVenue.mockResolvedValue({
          success: false,
          error: "errors.updateVenueFailed",
        })

        const result = await store.updateVenue("venue-1", updateData)

        expect(store.venues[0].name).toBe("Test Venue") // Unchanged
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.updateVenueFailed")
        expect(result).toBeNull()
      })

      it("should handle update exception", async () => {
        mockVenueService.updateVenue.mockRejectedValue(new Error("Network error"))

        const result = await store.updateVenue("venue-1", updateData)

        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.updateVenueFailed")
        expect(result).toBeNull()
      })
    })

    describe("deleteVenue", () => {
      beforeEach(() => {
        store.addVenue(sampleVenue)
      })

      it("should delete venue successfully", async () => {
        mockVenueService.deleteVenue.mockResolvedValue({
          success: true,
        })

        const result = await store.deleteVenue("venue-1")

        expect(mockVenueService.deleteVenue).toHaveBeenCalledWith("venue-1")
        expect(store.venueCount).toBe(0)
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBeNull()
        expect(result).toBe(true)
      })

      it("should handle delete error", async () => {
        mockVenueService.deleteVenue.mockResolvedValue({
          success: false,
          error: "errors.deleteVenueFailed",
        })

        const result = await store.deleteVenue("venue-1")

        expect(store.venueCount).toBe(1) // Unchanged
        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.deleteVenueFailed")
        expect(result).toBe(false)
      })

      it("should handle delete exception", async () => {
        mockVenueService.deleteVenue.mockRejectedValue(new Error("Network error"))

        const result = await store.deleteVenue("venue-1")

        expect(store.isLoading).toBe(false)
        expect(store.lastError).toBe("errors.deleteVenueFailed")
        expect(result).toBe(false)
      })
    })
  })

  // BREADCRUMB: Completed comprehensive VenueStore tests
})