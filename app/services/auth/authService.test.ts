import { signIn, signUp } from './authService'
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
      signUp: jest.fn(),
    }
  }
}))

// Mock the auth helpers
jest.mock('./authHelpers', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validatePasswordConfirmation: jest.fn(),
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
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInVzZXJfcm9sZSI6InVzZXIiLCJwZXJtaXNzaW9ucyI6W10sImlzX2J1c2luZXNzX3VzZXIiOmZhbHNlLCJidXNpbmVzc19zdGF0dXMiOiJub25lIn0.mock-signature',
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
        businessProfile: null,
        userRole: 'user',
        permissions: [],
        isBusinessUser: false,
        businessStatus: 'none'
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

  describe('signUp', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      userType: 'user' as const
    }

    it('should return error when email validation fails', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({
        isValid: false,
        error: 'errors:invalidEmail'
      })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({ isValid: true })

      const result = await signUp(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:invalidEmail')
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return error when password validation fails', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({
        isValid: false,
        error: 'errors:passwordRequired'
      })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({ isValid: true })

      const result = await signUp(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:passwordRequired')
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return error when password confirmation validation fails', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({
        isValid: false,
        error: 'errors:passwordMismatch'
      })

      const result = await signUp(validCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:passwordMismatch')
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return success when credentials are valid and email verification not required', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({ isValid: true })

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }
      const mockSession = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInVzZXJfcm9sZSI6InVzZXIiLCJwZXJtaXNzaW9ucyI6W10sImlzX2J1c2luZXNzX3VzZXIiOmZhbHNlLCJidXNpbmVzc19zdGF0dXMiOiJub25lIn0.mock-signature',
        user: mockUser
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signUp(validCredentials)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        userType: 'user',
        profile: null,
        businessProfile: null,
        userRole: 'user',
        permissions: [],
        isBusinessUser: false,
        businessStatus: 'none'
      })
      expect(result.session).toBe(mockSession)
      expect(result.requiresEmailVerification).toBe(false)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            user_type: 'user'
          }
        }
      })
    })

    it('should return success when credentials are valid and email verification required', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({ isValid: true })

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // No session means email verification required
        error: null
      })

      const result = await signUp(validCredentials)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        userType: 'user',
        profile: null,
        businessProfile: null,
        userRole: 'user',
        permissions: [],
        isBusinessUser: false,
        businessStatus: 'none'
      })
      expect(result.session).toBe(undefined)
      expect(result.requiresEmailVerification).toBe(true)
    })

    it('should handle business user type correctly', async () => {
      mockAuthHelpers.validateEmail.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePassword.mockReturnValue({ isValid: true })
      mockAuthHelpers.validatePasswordConfirmation.mockReturnValue({ isValid: true })

      const businessCredentials = {
        email: 'business@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'business' as const
      }

      const mockUser = {
        id: 'business-123',
        email: 'business@example.com'
      }
      const mockSession = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJidXNpbmVzcy0xMjMiLCJ1c2VyX3JvbGUiOiJidXNpbmVzcyIsInBlcm1pc3Npb25zIjpbXSwiaXNfYnVzaW5lc3NfdXNlciI6dHJ1ZSwiYnVzaW5lc3Nfc3RhdHVzIjoicGVuZGluZyJ9.mock-signature',
        user: mockUser
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signUp(businessCredentials)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'business-123',
        email: 'business@example.com',
        userType: 'business',
        profile: null,
        businessProfile: null,
        userRole: 'business',
        permissions: [],
        isBusinessUser: true,
        businessStatus: 'pending'
      })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'business@example.com',
        password: 'password123',
        options: {
          data: {
            user_type: 'business'
          }
        }
      })
    })
  })
})
