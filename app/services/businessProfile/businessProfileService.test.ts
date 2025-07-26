import { getBusinessProfile } from './businessProfileService'
import { supabase } from '@/clients/supabase/SupabaseClient'

// Mock Supabase client
jest.mock('@/clients/supabase/SupabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('getBusinessProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch business profile successfully', async () => {
    const mockProfile = {
      id: 'test-id',
      business_name: 'Test Business',
      business_types: ['restaurant'],
      description: 'A test business',
      phone: '+90 555 123 4567',
      website_url: 'https://example.com',
      logo_url: null,
      business_status: 'verified',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    // Setup mock return value
    const mockChain = {
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const result = await getBusinessProfile('test-id')

    expect(result.success).toBe(true)
    expect(result.profile).toEqual(mockProfile)
    expect(mockSupabase.from).toHaveBeenCalledWith('business_profiles')
  })

  it('should handle database error', async () => {
    const mockChain = {
      single: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Record not found' }
      })
    }
    const mockEq = jest.fn().mockReturnValue(mockChain)
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const result = await getBusinessProfile('invalid-id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Record not found')
  })
})