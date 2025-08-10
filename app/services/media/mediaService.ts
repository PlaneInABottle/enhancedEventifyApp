/**
 * Media Service
 * Handles all media operations for the polymorphic media system
 */

import { supabase } from '@/clients'
import type {
  MediaItem,
  MediaUploadResult,
  MediaListResult,
  MediaDeleteResult,
  EntityType,
  FileType,
  MediaUploadOptions,
  MediaMetadata
} from './mediaTypes'
import { MEDIA_CONSTANTS, STORAGE_BUCKETS } from './mediaTypes'

/**
 * Upload media for any entity type
 */
export async function uploadMedia(
  entityType: EntityType,
  entityId: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  try {
    // Validate inputs
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return { success: false, error: "errors.invalidFile" }
    }

    // Determine file type
    const fileType = getFileTypeFromMimeType(mimeType)
    if (!fileType) {
      return { success: false, error: "errors.invalidFileType" }
    }

    // Validate file size
    const maxSize = MEDIA_CONSTANTS.MAX_FILE_SIZE[fileType.toUpperCase() as keyof typeof MEDIA_CONSTANTS.MAX_FILE_SIZE]
    if (arrayBuffer.byteLength > maxSize) {
      return { success: false, error: "errors.fileTooLarge" }
    }

    // Validate mime type
    if (!isValidMimeType(mimeType, fileType)) {
      return { success: false, error: "errors.invalidFileType" }
    }

    // Generate file path
    const fileExt = getFileExtension(mimeType)
    const fileName = `${entityType}-${entityId}-${Date.now()}.${fileExt}`
    const bucket = STORAGE_BUCKETS[entityType]
    const filePath = `${entityId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        upsert: false,
        contentType: mimeType,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: "errors.uploadFailed" }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    // Extract metadata if it's an image
    const metadata = fileType === 'image' ? await extractImageMetadata(arrayBuffer) : {}


    // Insert media record
    const { data: mediaData, error: insertError } = await supabase
      .from('media')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        file_url: publicUrl,
        file_type: fileType,
        mime_type: mimeType,
        file_size: arrayBuffer.byteLength,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        alt_text: options.alt_text,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        is_active: true,
        entity_exists: true,
        entity_last_checked: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from(bucket).remove([filePath])
      return { success: false, error: "errors.databaseError" }
    }

    return {
      success: true,
      media: mediaData as MediaItem
    }

  } catch (error) {
    console.error('Unexpected error uploading media:', error)
    return { success: false, error: "errors.unknownError" }
  }
}

/**
 * Get all media for an entity
 */
export async function getMediaForEntity(
  entityType: EntityType,
  entityId: string
): Promise<MediaListResult> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching media:', error)
      return { success: false, error: "errors.fetchFailed" }
    }

    return {
      success: true,
      media: data as MediaItem[]
    }
  } catch (error) {
    console.error('Unexpected error fetching media:', error)
    return { success: false, error: "errors.unknownError" }
  }
}

/**
 * Get first media URL for an entity (helper for primary image)
 */
export async function getFirstMediaUrl(
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  const result = await getMediaForEntity(entityType, entityId)
  if (result.success && result.media && result.media.length > 0) {
    return result.media[0].file_url
  }
  return null
}

/**
 * Delete media by ID
 */
export async function deleteMedia(mediaId: string): Promise<MediaDeleteResult> {
  try {
    // Get media info first
    const { data: mediaItem, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !mediaItem) {
      return { success: false, error: "errors.mediaNotFound" }
    }

    // Extract file path from URL
    const filePath = extractFilePathFromUrl(mediaItem.file_url)
    const bucket = STORAGE_BUCKETS[mediaItem.entity_type as EntityType]

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Mark as inactive in database
    const { error: updateError } = await supabase
      .from('media')
      .update({ is_active: false })
      .eq('id', mediaId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return { success: false, error: "errors.databaseError" }
    }

    return { success: true }

  } catch (error) {
    console.error('Unexpected error deleting media:', error)
    return { success: false, error: "errors.unknownError" }
  }
}


// Helper functions

function getFileTypeFromMimeType(mimeType: string): FileType | null {
  if (MEDIA_CONSTANTS.SUPPORTED_IMAGE_TYPES.includes(mimeType as any)) {
    return 'image'
  }
  if (MEDIA_CONSTANTS.SUPPORTED_VIDEO_TYPES.includes(mimeType as any)) {
    return 'video'
  }
  if (MEDIA_CONSTANTS.SUPPORTED_DOCUMENT_TYPES.includes(mimeType as any)) {
    return 'document'
  }
  return null
}

function isValidMimeType(mimeType: string, fileType: FileType): boolean {
  switch (fileType) {
    case 'image':
      return MEDIA_CONSTANTS.SUPPORTED_IMAGE_TYPES.includes(mimeType as any)
    case 'video':
      return MEDIA_CONSTANTS.SUPPORTED_VIDEO_TYPES.includes(mimeType as any)
    case 'document':
      return MEDIA_CONSTANTS.SUPPORTED_DOCUMENT_TYPES.includes(mimeType as any)
    default:
      return false
  }
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/mov': 'mov',
    'application/pdf': 'pdf',
    'text/plain': 'txt'
  }
  return extensions[mimeType] || 'bin'
}

async function extractImageMetadata(arrayBuffer: ArrayBuffer): Promise<MediaMetadata> {
  // For now, return empty metadata - this would need image processing library
  // In a full implementation, we'd use a library like sharp or canvas to get dimensions
  return {}
}


function extractFilePathFromUrl(url: string): string {
  // Extract path after the bucket name in Supabase storage URL
  const urlParts = url.split('/')
  const bucketIndex = urlParts.findIndex(part => 
    Object.values(STORAGE_BUCKETS).includes(part)
  )
  if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
    return urlParts.slice(bucketIndex + 1).join('/')
  }
  return url.split('/').pop() || ''
}