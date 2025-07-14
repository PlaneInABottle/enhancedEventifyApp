import { signIn } from './authService'
import { supabase } from '@/clients/supabase/SupabaseClient'
import * as authHelpers from './authHelpers'
import type { AuthError } from '@supabase/supabase-js'

/**
 * Unit tests for authentication service
 */

// Mock the Supabase client
jest.mock('@/clients/supabase/SupabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    }
  }
}))

// Mock the auth helpers
jest.mock('./authHelpers', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  mapAuthError: jest.fn(),
}))

const mockSupabase = supabase as any
const mockAuthHelpers = authHelpers as jest.Mocked<typeof authHelpers>

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signIn', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should return error when email validation fails', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({
        isValid: false,
        error: 'errors:invalidEmail'
      })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should return error when password validation fails', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({
        isValid: false,
        error: 'errors:passwordRequired'
      })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:passwordRequired')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should return success when credentials are valid', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }
      const mockSession = {
        access_token: 'mock-token',
        user: mockUser
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        userType: 'user',
        profile: null,
        businessProfile: null
      })
      expect(result.session).toBe(mockSession)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith(validCredentials)
    })

    it('should handle Supabase auth errors', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })

      const mockError = {
        status: 400,
        message: 'Invalid login credentials',
        code: 'invalid_credentials',
        __isAuthError: true,
        name: 'AuthError'
      } as any
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      mockAuthHelpers.mapAuthError.mockReturnValue({
        type: 'invalid_credentials',
        message: 'errors:invalidCredentials',
        originalError: mockError
      })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:invalidCredentials')
      expect(mockAuthHelpers.mapAuthError).toHaveBeenCalledWith(mockError)
    })

    it('should return error when Supabase returns null user/session', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:unknownError')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })

      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await signIn(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:unknownError')
    })
  })
})
