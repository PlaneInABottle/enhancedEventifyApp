import type { AuthError } from "@supabase/supabase-js"

import { mapAuthError } from "./authHelpers"

/**
 * Unit tests for authentication helper functions
 */

describe("authHelpers", () => {
  // ========================================================================
  // ERROR MAPPING TESTS
  // ========================================================================

  describe("mapAuthError", () => {
    it("should map invalid login credentials error", () => {
      const mockError = {
        status: 400,
        message: "Invalid login credentials",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("invalid_credentials")
      expect(result.message).toBe("errors:invalidCredentials")
      expect(result.originalError).toBe(mockError)
    })

    it("should map email not confirmed error", () => {
      const mockError = {
        status: 400,
        message: "Email not confirmed",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("email_not_confirmed")
      expect(result.message).toBe("errors:emailNotConfirmed")
      expect(result.originalError).toBe(mockError)
    })

    it("should map too many requests error", () => {
      const mockError = {
        status: 429,
        message: "Too many requests",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("too_many_requests")
      expect(result.message).toBe("errors:tooManyRequests")
      expect(result.originalError).toBe(mockError)
    })

    it("should map server errors (500)", () => {
      const mockError = {
        status: 500,
        message: "Internal server error",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("service_unavailable")
      expect(result.message).toBe("errors:serviceUnavailable")
      expect(result.originalError).toBe(mockError)
    })

    it("should map server errors (502)", () => {
      const mockError = {
        status: 502,
        message: "Bad gateway",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("service_unavailable")
      expect(result.message).toBe("errors:serviceUnavailable")
      expect(result.originalError).toBe(mockError)
    })

    it("should map server errors (503)", () => {
      const mockError = {
        status: 503,
        message: "Service unavailable",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("service_unavailable")
      expect(result.message).toBe("errors:serviceUnavailable")
      expect(result.originalError).toBe(mockError)
    })

    it("should map network errors by message", () => {
      const mockError = {
        message: "Network connection failed",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("network_error")
      expect(result.message).toBe("errors:networkError")
      expect(result.originalError).toBe(mockError)
    })

    it("should map fetch errors by message", () => {
      const mockError = {
        message: "Fetch request failed",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("network_error")
      expect(result.message).toBe("errors:networkError")
      expect(result.originalError).toBe(mockError)
    })

    it("should map connection errors by message", () => {
      const mockError = {
        message: "Connection timeout",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("network_error")
      expect(result.message).toBe("errors:networkError")
      expect(result.originalError).toBe(mockError)
    })

    it("should default to unknown error for unrecognized errors", () => {
      const mockError = {
        message: "Some random error",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("unknown_error")
      expect(result.message).toBe("errors:unknownError")
      expect(result.originalError).toBe(mockError)
    })

    it("should handle case insensitive error message matching", () => {
      const mockError = {
        status: 400,
        message: "INVALID LOGIN CREDENTIALS",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("invalid_credentials")
      expect(result.message).toBe("errors:invalidCredentials")
    })

    it("should handle errors without status property", () => {
      const mockError = {
        message: "Some generic error",
      } as AuthError

      const result = mapAuthError(mockError)

      expect(result.type).toBe("unknown_error")
      expect(result.message).toBe("errors:unknownError")
      expect(result.originalError).toBe(mockError)
    })
  })
})
