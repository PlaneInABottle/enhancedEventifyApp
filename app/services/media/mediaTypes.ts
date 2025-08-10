/**
 * Media Service Types
 * TypeScript interfaces for the polymorphic media system
 */

export type EntityType = 'event' | 'venue' | 'business' | 'user'
export type FileType = 'image' | 'video' | 'document'

export interface MediaItem {
  id: string
  entity_id: string
  entity_type: EntityType
  file_url: string
  file_type: FileType
  mime_type: string
  file_size: number
  width?: number
  height?: number
  duration?: number // for videos in seconds
  alt_text?: string
  uploaded_by: string
  is_active: boolean
  entity_exists: boolean
  entity_last_checked?: string
  created_at: string
  updated_at: string
}

export interface MediaUploadResult {
  success: boolean
  media?: MediaItem
  error?: string
}

export interface MediaListResult {
  success: boolean
  media?: MediaItem[]
  error?: string
}

export interface MediaDeleteResult {
  success: boolean
  error?: string
}

export interface MediaUploadOptions {
  alt_text?: string
}

export interface MediaMetadata {
  width?: number
  height?: number
  duration?: number
}

// File validation constants
export const MEDIA_CONSTANTS = {
  MAX_FILE_SIZE: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
    DOCUMENT: 25 * 1024 * 1024, // 25MB
  },
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  SUPPORTED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/mov'
  ],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'text/plain'
  ]
} as const

// Storage bucket mapping
export const STORAGE_BUCKETS: Record<EntityType, string> = {
  event: 'event-images',
  venue: 'venue-images', 
  business: 'business-logos',
  user: 'user-avatars'
} as const