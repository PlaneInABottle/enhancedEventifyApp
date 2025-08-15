import { AuthStore } from "./AuthStore"
import { RootStoreModel } from "@/models/RootStore"
import { 
  createMockUser, 
  createMockBusinessUser, 
  createMockSession, 
  createMockAuthResponse 
} from "../../test/helpers/supabaseMocks"

/**
 * Unit tests for AuthStore - MobX State Tree store
 */

// Mock the Supabase client
jest.mock("@/clients/supabase/SupabaseClient", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

// Mock the auth service
jest.mock("@/services/auth", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  buildUserFromSession: jest.fn(),
}))

describe("AuthStore", () => {
  let rootStore: any
  let store: any

  beforeEach(() => {
    rootStore = RootStoreModel.create({})
    store = rootStore.authenticationStore
  })

  describe("initial state", () => {
    it("should have correct default values", () => {
      expect(store.user).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.lastError).toBeNull()
    })
  })

  describe("views", () => {
    it("should return null for user properties when no user", () => {
      expect(store.userId).toBeNull()
      expect(store.userEmail).toBeNull()
      expect(store.userType).toBeNull()
      expect(store.hasProfile).toBe(false)
      expect(store.hasBusinessProfile).toBe(false)
    })

    it("should return correct user properties when user exists", () => {
      const mockUser = createMockUser({
        profile: {
          id: "profile-123",
          display_name: "Test User",
          avatar_url: null,
          bio: null,
          location_city: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      })

      store.setProp("user", mockUser)

      expect(store.userId).toBe("user-123")
      expect(store.userEmail).toBe("test@example.com")
      expect(store.userType).toBe("user")
      expect(store.hasProfile).toBe(true)
      expect(store.hasBusinessProfile).toBe(false)
    })
  })

  describe("signIn flow", () => {
    const mockCredentials = {
      email: "test@example.com",
      password: "password123",
    }

    it("should handle successful sign in", async () => {
      const mockUser = createMockUser()
      const mockResult = createMockAuthResponse(true, {
        user: mockUser,
        session: { access_token: "mock-token" },
      })

      // Use the already mocked signIn
      const { signIn } = require("@/services/auth")
      signIn.mockResolvedValue(mockResult)

      const result = await store.signIn(mockCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.lastError).toBeNull()
      expect(result).toEqual(mockResult)
    })

    it("should handle sign in failure", async () => {
      const mockResult = createMockAuthResponse(false, {
        error: "errors:invalidCredentials",
      })

      const { signIn } = require("@/services/auth")
      signIn.mockResolvedValue(mockResult)

      const result = await store.signIn(mockCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.lastError).toBe("errors:invalidCredentials")
      expect(result).toEqual(mockResult)
    })
  })

  describe("signUp flow", () => {
    const mockCredentials = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      userType: "user" as const,
    }

    it("should handle successful sign up without email verification", async () => {
      const mockUser = createMockUser()
      const mockResult = createMockAuthResponse(true, {
        user: mockUser,
        session: { access_token: "mock-token" },
        requiresEmailVerification: false,
      })

      const { signUp } = require("@/services/auth")
      signUp.mockResolvedValue(mockResult)

      const result = await store.signUp(mockCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.lastError).toBeNull()
      expect(result).toEqual(mockResult)
    })

    it("should handle successful sign up with email verification required", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        userType: "user",
        profile: null,
        businessProfile: null,
      }

      const mockResult = {
        success: true,
        user: mockUser,
        session: undefined,
        requiresEmailVerification: true,
      }

      const { signUp } = require("@/services/auth")
      signUp.mockResolvedValue(mockResult)

      const result = await store.signUp(mockCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.lastError).toBeNull()
      expect(result).toEqual(mockResult)
    })

    it("should handle sign up failure", async () => {
      const mockResult = {
        success: false,
        error: "errors:emailAlreadyInUse",
      }

      const { signUp } = require("@/services/auth")
      signUp.mockResolvedValue(mockResult)

      const result = await store.signUp(mockCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.lastError).toBe("errors:emailAlreadyInUse")
      expect(result).toEqual(mockResult)
    })

    it("should handle business user sign up", async () => {
      const businessCredentials = {
        email: "business@example.com",
        password: "password123",
        confirmPassword: "password123",
        userType: "business" as const,
      }

      const mockUser = createMockBusinessUser({
        email: "business@example.com",
      })

      const mockResult = createMockAuthResponse(true, {
        user: mockUser,
        session: { access_token: "mock-token" },
        requiresEmailVerification: false,
      })

      const { signUp } = require("@/services/auth")
      signUp.mockResolvedValue(mockResult)

      const result = await store.signUp(businessCredentials)

      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.user.userType).toBe("business")
      expect(store.lastError).toBeNull()
      expect(result).toEqual(mockResult)
    })
  })

  describe("signOut flow", () => {
    beforeEach(() => {
      // Set up authenticated state
      store.setProp("user", {
        id: "user-123",
        email: "test@example.com",
        userType: "user",
        profile: null,
        businessProfile: null,
      })
      store.setProp("isAuthenticated", true)
    })

    it("should handle successful sign out", async () => {
      const { supabase } = require("@/clients/supabase/SupabaseClient")
      supabase.auth.signOut.mockResolvedValue({ error: null })

      await store.signOut()

      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
      // Note: user state clearing is handled by onAuthStateChange
    })
  })

  describe("_handleAuthStateChange", () => {
    it("should handle SIGNED_OUT event", () => {
      // Set up authenticated state first with complete user object
      store.setProp("user", {
        id: "user-123",
        email: "test@example.com",
        userType: "user",
        profile: null,
        businessProfile: null,
      })
      store.setProp("isAuthenticated", true)
      store.setProp("lastError", "some error")

      store._handleAuthStateChange("SIGNED_OUT", null)

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.lastError).toBeNull()
    })

    it("should clear map store events on SIGNED_OUT event", () => {
      // Add some mock events to the map store
      const mockEvents = [{
        instance_id: "123",
        event_id: "456",
        venue_id: "789",
        start_datetime: "2025-01-27T10:00:00Z",
        end_datetime: "2025-01-27T12:00:00Z",
        event_instance_status: "scheduled",
        max_attendees: 100,
        event_title: "Test Event",
        event_description: "Test Description",
        venue_name: "Test Venue",
        venue_capacity: 200,
        coordinates: {
          type: "Point" as const,
          coordinates: [29.0, 41.0] as [number, number],
        },
        full_address: "Test Address",
        city: "Istanbul",
      }]
      
      rootStore.mapStore.setEvents(mockEvents)
      rootStore.mapStore.setProp("lastError", "some map error")
      
      // Verify events are present
      expect(rootStore.mapStore.events.length).toBe(1)
      expect(rootStore.mapStore.lastError).toBe("some map error")

      // Trigger logout
      store._handleAuthStateChange("SIGNED_OUT", null)

      // Verify map store is cleared
      expect(rootStore.mapStore.events.length).toBe(0)
      expect(rootStore.mapStore.lastError).toBeNull()
    })

    it("should handle SIGNED_IN event", () => {
      const mockSession = createMockSession()
      const expectedUser = createMockUser()

      const { buildUserFromSession } = require("@/services/auth")
      buildUserFromSession.mockReturnValue(expectedUser)

      store._handleAuthStateChange("SIGNED_IN", mockSession)

      expect(store.user).toEqual(expectedUser)
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe("clearError", () => {
    it("should clear the lastError state", () => {
      // Set an error first
      store.setProp("lastError", "errors:someError")
      expect(store.lastError).toBe("errors:someError")

      // Clear the error
      store.clearError()
      expect(store.lastError).toBeNull()
    })

    it("should handle clearing when no error exists", () => {
      // Ensure no error exists
      expect(store.lastError).toBeNull()

      // Should not throw when clearing
      expect(() => store.clearError()).not.toThrow()
      expect(store.lastError).toBeNull()
    })
  })
})
