/**
 * Shared Supabase Mock Utilities
 * 
 * Provides consistent mocking patterns for Supabase operations across all tests.
 * Based on the testing-guide-setup-configuration patterns.
 */

/**
 * Creates a mock Supabase query chain with all common methods
 * Returns a chainable mock that can be customized per test
 */
export const createSupabaseMockChain = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  abortSignal: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  csv: jest.fn(),
  geojson: jest.fn(),
  explain: jest.fn(),
  rollback: jest.fn(),
  returns: jest.fn().mockReturnThis(),
})

/**
 * Creates a mock Supabase client with auth and database operations
 * Can be customized per test by overriding specific methods
 */
export const createSupabaseClientMock = () => ({
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    setSession: jest.fn(),
    refreshSession: jest.fn(),
    getUserIdentities: jest.fn(),
    linkIdentity: jest.fn(),
    unlinkIdentity: jest.fn(),
  },
  from: jest.fn(() => createSupabaseMockChain()),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
      createSignedUrls: jest.fn(),
      move: jest.fn(),
      copy: jest.fn(),
    })),
  },
  realtime: {
    channel: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      send: jest.fn(),
    })),
  },
  rpc: jest.fn(),
})

/**
 * Helper to set up successful Supabase response
 */
export const createSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK',
})

/**
 * Helper to set up error Supabase response
 */
export const createErrorResponse = (message: string, code?: string, status = 400) => ({
  data: null,
  error: {
    message,
    code,
    details: null,
    hint: null,
  },
  status,
  statusText: 'Bad Request',
})

/**
 * Common error responses for consistent testing
 */
export const COMMON_ERRORS = {
  NOT_FOUND: createErrorResponse('Not found', 'PGRST116', 404),
  UNAUTHORIZED: createErrorResponse('Unauthorized', '401', 401),
  DUPLICATE_KEY: createErrorResponse('Duplicate key violation', '23505', 409),
  DATABASE_ERROR: createErrorResponse('Database error', 'PGRST000', 500),
  PERMISSION_DENIED: createErrorResponse('Permission denied', 'PGRST001', 403),
} as const

/**
 * Auth-specific mock factories for consistent user testing
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  userType: 'user',
  profile: null,
  businessProfile: null,
  userRole: 'user',
  permissions: [],
  isBusinessUser: false,
  businessStatus: 'none',
  ...overrides,
})

export const createMockBusinessUser = (overrides = {}) => ({
  id: 'business-123',
  email: 'business@example.com',
  userType: 'business',
  profile: null,
  businessProfile: null,
  userRole: 'business',
  permissions: [],
  isBusinessUser: true,
  businessStatus: 'pending',
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    ...overrides.user,
  },
  access_token: 'mock-access-token-secure-opaque-string-12345',
  ...overrides,
})

export const createMockAuthResponse = (success = true, overrides = {}) => {
  if (success) {
    return {
      success: true,
      user: createMockUser(),
      session: createMockSession(),
      requiresEmailVerification: false,
      ...overrides,
    }
  }
  
  return {
    success: false,
    error: 'errors:invalidCredentials',
    ...overrides,
  }
}

/**
 * Helper to mock a complete Supabase service call chain
 * 
 * @example
 * ```typescript
 * const mockSupabase = createSupabaseMockChain()
 * setupMockChainResponse(mockSupabase, 'single', createSuccessResponse(mockData))
 * ```
 */
export const setupMockChainResponse = (
  mockChain: ReturnType<typeof createSupabaseMockChain>,
  method: 'single' | 'maybeSingle' | 'order',
  response: any
) => {
  mockChain[method].mockResolvedValue(response)
}

/**
 * Pre-configured mock chains for common operations
 */
export const MOCK_CHAINS = {
  /**
   * Mock for successful single record operations (insert, update, select single)
   */
  singleSuccess: <T>(data: T) => {
    const chain = createSupabaseMockChain()
    setupMockChainResponse(chain, 'single', createSuccessResponse(data))
    return chain
  },

  /**
   * Mock for successful list operations (select multiple)
   */
  listSuccess: <T>(data: T[]) => {
    const chain = createSupabaseMockChain()
    setupMockChainResponse(chain, 'order', createSuccessResponse(data))
    return chain
  },

  /**
   * Mock for error responses
   */
  error: (error: any) => {
    const chain = createSupabaseMockChain()
    setupMockChainResponse(chain, 'single', error)
    return chain
  },
} as const

/**
 * Service-level response helpers for business logic testing
 * Use these for consistent service response mocking
 */
export const createFailureResponse = (error: string) => ({
  success: false,
  error,
})

export const createServiceSuccessResponse = <T>(data: T) => ({
  success: true,
  ...data,
})

/**
 * Service-level mock helpers for testing business logic
 * Use these when you want to test store/component integration with services
 */
export const createServiceMocks = () => ({
  // Event service mocks
  createEvent: jest.fn(),
  getEvent: jest.fn(),
  getEventsForBusiness: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  createEventInstance: jest.fn(),
  updateEventInstance: jest.fn(),
  deleteEventInstance: jest.fn(),

  // Profile service mocks
  getBusinessProfile: jest.fn(),
  updateBusinessProfile: jest.fn(),
  uploadLogo: jest.fn(),

  // Auth service mocks
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  
  // Media service mocks
  uploadMedia: jest.fn(),
  deleteMedia: jest.fn(),
  getMediaForEntity: jest.fn(),
})

/**
 * Creates service mocks specifically for BusinessProfileStore testing
 */
export const setupServiceMocks = () => {
  const { getBusinessProfile, updateBusinessProfile, uploadLogo } = require('@/services/businessProfile/businessProfileService')
  return {
    mockGetBusinessProfile: getBusinessProfile as jest.Mock,
    mockUpdateBusinessProfile: updateBusinessProfile as jest.Mock,
    mockUploadLogo: uploadLogo as jest.Mock,
  }
}

/**
 * Reset all mocks between tests
 * Call this in beforeEach for clean test state
 */
export const resetAllMocks = (...mocks: any[]) => {
  mocks.forEach(mock => {
    if (mock && typeof mock.mockClear === 'function') {
      mock.mockClear()
    } else if (typeof mock === 'object') {
      Object.values(mock).forEach(fn => {
        if (fn && typeof fn.mockClear === 'function') {
          fn.mockClear()
        }
      })
    }
  })
}