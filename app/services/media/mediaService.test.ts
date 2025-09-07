/**
 * Media Service Tests
 * Tests for polymorphic media system functionality
 */

import { uploadMedia, getMediaForEntity, getFirstMediaUrl, deleteMedia } from './mediaService'
import type { MediaItem } from './mediaTypes'

// Mock Supabase client
jest.mock('@/clients', () => {
  const mockFrom = jest.fn()
  const mockStorage = jest.fn()
  const mockAuth = {
    getUser: jest.fn()
  }

  return {
    supabase: {
      from: mockFrom,
      storage: {
        from: mockStorage
      },
      auth: mockAuth
    }
  }
})

import { supabase } from '@/clients'

describe('Media Service', () => {
  const mockFrom = supabase.from as jest.Mock
  const mockStorage = supabase.storage.from as jest.Mock
  const mockGetUser = supabase.auth.getUser as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadMedia', () => {
    const validImageBuffer = new ArrayBuffer(1024)
    const validImageMime = 'image/jpeg'
    const entityType = 'event'
    const entityId = 'test-event-id'

    it('should upload image successfully', async () => {
      // Mock storage operations
      const mockStorageOps = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/test-url.jpg' }
        })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      // Mock database operations
      const mockMediaItem: MediaItem = {
        id: 'media-123',
        entity_id: entityId,
        entity_type: entityType,
        file_url: 'https://storage.supabase.co/test-url.jpg',
        file_type: 'image',
        mime_type: validImageMime,
        file_size: 1024,
        width: undefined,
        height: undefined,
        duration: undefined,
        alt_text: undefined,
        uploaded_by: 'user-123',
        is_active: true,
        entity_exists: true,
        entity_last_checked: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      const mockDbOps = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaItem,
              error: null
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      // Mock auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const result = await uploadMedia(entityType, entityId, validImageBuffer, validImageMime)

      expect(result.success).toBe(true)
      expect(result.media).toEqual(mockMediaItem)
      expect(result.error).toBeUndefined()
      expect(mockStorageOps.upload).toHaveBeenCalled()
      expect(mockDbOps.insert).toHaveBeenCalled()
    })

    it('should return error for empty file', async () => {
      const emptyBuffer = new ArrayBuffer(0)
      
      const result = await uploadMedia(entityType, entityId, emptyBuffer, validImageMime)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:invalidFile')
      expect(result.media).toBeUndefined()
    })

    it('should return error for invalid mime type', async () => {
      const invalidMime = 'application/malware'
      
      const result = await uploadMedia(entityType, entityId, validImageBuffer, invalidMime)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:invalidFileType')
      expect(result.media).toBeUndefined()
    })

    it('should return error for file too large', async () => {
      // Create buffer larger than 10MB limit
      const largeBuffer = new ArrayBuffer(11 * 1024 * 1024)
      
      const result = await uploadMedia(entityType, entityId, largeBuffer, validImageMime)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:fileTooLarge')
      expect(result.media).toBeUndefined()
    })

    it('should return error when storage upload fails', async () => {
      const mockStorageOps = {
        upload: jest.fn().mockResolvedValue({ 
          error: { message: 'Storage error' } 
        })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      const result = await uploadMedia(entityType, entityId, validImageBuffer, validImageMime)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:uploadFailed')
      expect(result.media).toBeUndefined()
    })

    it('should return error and cleanup when database insert fails', async () => {
      // Mock successful storage operations
      const mockStorageOps = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/test-url.jpg' }
        }),
        remove: jest.fn().mockResolvedValue({ error: null })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      // Mock failed database insert
      const mockDbOps = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      // Mock auth
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const result = await uploadMedia(entityType, entityId, validImageBuffer, validImageMime)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:databaseError')
      expect(result.media).toBeUndefined()
      // Verify cleanup was called
      expect(mockStorageOps.remove).toHaveBeenCalled()
    })
  })

  describe('getMediaForEntity', () => {
    const entityType = 'event'
    const entityId = 'test-event-id'

    it('should fetch media successfully', async () => {
      const mockMediaItems: MediaItem[] = [
        {
          id: 'media-1',
          entity_id: entityId,
          entity_type: entityType,
          file_url: 'https://storage.supabase.co/test1.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: 'user-123',
          is_active: true,
          entity_exists: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'media-2',
          entity_id: entityId,
          entity_type: entityType,
          file_url: 'https://storage.supabase.co/test2.jpg',
          file_type: 'image',
          mime_type: 'image/png',
          file_size: 2048,
          uploaded_by: 'user-123',
          is_active: true,
          entity_exists: true,
          created_at: '2024-01-01T01:00:00.000Z',
          updated_at: '2024-01-01T01:00:00.000Z',
        }
      ] as MediaItem[]

      const mockDbOps = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockMediaItems,
                  error: null
                })
              })
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      const result = await getMediaForEntity(entityType, entityId)

      expect(result.success).toBe(true)
      expect(result.media).toEqual(mockMediaItems)
      expect(result.error).toBeUndefined()
    })

    it('should return error when database query fails', async () => {
      const mockDbOps = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      const result = await getMediaForEntity(entityType, entityId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:fetchFailed')
      expect(result.media).toBeUndefined()
    })
  })

  describe('getFirstMediaUrl', () => {
    const entityType = 'event'
    const entityId = 'test-event-id'

    it('should return first media URL when media exists', async () => {
      const mockMediaItems: MediaItem[] = [
        {
          id: 'media-1',
          entity_id: entityId,
          entity_type: entityType,
          file_url: 'https://storage.supabase.co/first.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: 'user-123',
          is_active: true,
          entity_exists: true,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }
      ] as MediaItem[]

      const mockDbOps = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockMediaItems,
                  error: null
                })
              })
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      const result = await getFirstMediaUrl(entityType, entityId)

      expect(result).toBe('https://storage.supabase.co/first.jpg')
    })

    it('should return null when no media exists', async () => {
      const mockDbOps = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      const result = await getFirstMediaUrl(entityType, entityId)

      expect(result).toBeNull()
    })

    it('should return null when fetch fails', async () => {
      const mockDbOps = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          })
        })
      }
      mockFrom.mockReturnValue(mockDbOps)

      const result = await getFirstMediaUrl(entityType, entityId)

      expect(result).toBeNull()
    })
  })

  describe('deleteMedia', () => {
    const mediaId = 'media-123'
    const mockMediaItem = {
      id: mediaId,
      entity_id: 'event-123',
      entity_type: 'event',
      file_url: 'https://storage.supabase.co/event-images/event-123/file.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      file_size: 1024,
      uploaded_by: 'user-123',
      is_active: true,
      entity_exists: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    }

    it('should delete media successfully', async () => {
      // Mock fetch media - needs different structure for single item fetch
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaItem,
              error: null
            })
          })
        })
      })

      // Mock storage deletion
      const mockStorageOps = {
        remove: jest.fn().mockResolvedValue({ error: null })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      // Mock database update
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await deleteMedia(mediaId)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockStorageOps.remove).toHaveBeenCalled()
    })

    it('should return error when media not found', async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      })

      const result = await deleteMedia(mediaId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:mediaNotFound')
    })

    it('should continue with soft delete even if storage deletion fails', async () => {
      // Mock fetch media
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaItem,
              error: null
            })
          })
        })
      })

      // Mock storage deletion failure
      const mockStorageOps = {
        remove: jest.fn().mockResolvedValue({ 
          error: { message: 'Storage error' }
        })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      // Mock successful database update
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await deleteMedia(mediaId)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return error when database update fails', async () => {
      // Mock fetch media
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMediaItem,
              error: null
            })
          })
        })
      })

      // Mock storage deletion
      const mockStorageOps = {
        remove: jest.fn().mockResolvedValue({ error: null })
      }
      mockStorage.mockReturnValue(mockStorageOps)

      // Mock database update failure
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      const result = await deleteMedia(mediaId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('errors:databaseError')
    })
  })
})