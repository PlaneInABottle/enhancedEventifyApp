/**
 * Profile Types for Enhanced Eventify
 *
 * Based on the user_profiles database schema
 */

// ============================================================================
// PROFILE DATA TYPES
// ============================================================================

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  location_city: TurkishCity | null
  created_at: string
  updated_at: string
}

export type TurkishCity =
  | "İstanbul"
  | "Ankara"
  | "İzmir"
  | "Bursa"
  | "Antalya"
  | "Adana"
  | "Konya"
  | "Gaziantep"
  | "Kayseri"
  | "Eskişehir"
  | "Diyarbakır"
  | "Samsun"
  | "Denizli"
  | "Şanlıurfa"
  | "Adapazarı"
  | "Malatya"
  | "Kahramanmaraş"
  | "Erzurum"
  | "Van"
  | "Batman"
  | "Elazığ"
  | "İzmit"
  | "Manisa"
  | "Sivas"
  | "Gebze"
  | "Balıkesir"
  | "Tarsus"
  | "Kütahya"
  | "Trabzon"
  | "Çorum"
  | "Other"

// ============================================================================
// UPDATE REQUEST TYPES
// ============================================================================

export interface UpdateProfileRequest {
  display_name?: string
  avatar_url?: string
  bio?: string
  location_city?: TurkishCity
}

export interface ProfileResult {
  success: boolean
  profile?: UserProfile
  error?: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ProfileValidationResult {
  isValid: boolean
  error?: string
}

export interface ProfileCompletionStatus {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface AvatarUploadResult {
  success: boolean
  avatarUrl?: string
  error?: string
}

export interface StorageUploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ProfileErrorType =
  | "profile_not_found"
  | "invalid_display_name"
  | "invalid_bio"
  | "upload_failed"
  | "storage_error"
  | "invalid_file_type"
  | "file_too_large"
  | "update_failed"
  | "network_error"
  | "unknown_error"

export interface CustomProfileError {
  type: ProfileErrorType
  message: string
  originalError?: any
}

// Supabase Storage Error Format (based on documentation)
export interface SupabaseStorageError {
  code?: string
  message: string
  httpStatusCode?: number
}
