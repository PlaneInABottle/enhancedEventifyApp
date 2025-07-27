import type { TxKeyPath } from "@/i18n"

/**
 * Common validation utilities used across the app
 */

export interface ValidationResult {
  success: boolean
  error?: TxKeyPath
}

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    return { success: false, error: "errors:emailRequired" }
  }

  if (!emailRegex.test(email)) {
    return { success: false, error: "errors:invalidEmail" }
  }

  return { success: true }
}

/**
 * Validates phone number with international format support
 */
export function validatePhone(phone: string, isRequired: boolean = false): ValidationResult {
  if (!phone || !phone.trim()) {
    return isRequired ? { success: false, error: "errors:phoneRequired" } : { success: true }
  }

  // Basic phone validation - allows international formats
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/
  if (!phoneRegex.test(phone.trim())) {
    return { success: false, error: "errors:phoneInvalid" }
  }

  return { success: true }
}

/**
 * Validates URL format
 */
export function validateUrl(url: string, isRequired: boolean = false): ValidationResult {
  if (!url || !url.trim()) {
    return isRequired ? { success: false, error: "errors:urlRequired" } : { success: true }
  }

  try {
    // Add protocol if missing
    const urlToValidate = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`
    const urlObj = new URL(urlToValidate)

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { success: false, error: "errors:urlInvalid" }
    }

    return { success: true }
  } catch {
    return { success: false, error: "errors:urlInvalid" }
  }
}

/**
 * Validates string length
 */
export function validateStringLength(
  value: string,
  minLength?: number,
  maxLength?: number,
  fieldName: string = "field",
): ValidationResult {
  const length = value.trim().length

  if (minLength !== undefined && length < minLength) {
    return { success: false, error: `errors:${fieldName}TooShort` as TxKeyPath }
  }

  if (maxLength !== undefined && length > maxLength) {
    return { success: false, error: `errors:${fieldName}TooLong` as TxKeyPath }
  }

  return { success: true }
}

/**
 * Validates required field
 */
export function validateRequired(value: any, fieldName: string = "field"): ValidationResult {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)

  if (isEmpty) {
    return { success: false, error: `errors:${fieldName}Required` as TxKeyPath }
  }

  return { success: true }
}

/**
 * Validates file upload (for images)
 */
export function validateImageUpload(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  maxSizeMB: number = 5,
  supportedTypes: string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
): ValidationResult {
  // Check file exists
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    return { success: false, error: "errors:fileEmpty" }
  }

  // Check mime type
  if (!mimeType.startsWith("image/")) {
    return { success: false, error: "errors:fileNotImage" }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (arrayBuffer.byteLength > maxSizeBytes) {
    return { success: false, error: "errors:fileTooLarge" }
  }

  // Check supported types
  if (!supportedTypes.includes(mimeType)) {
    return { success: false, error: "errors:fileTypeNotSupported" }
  }

  return { success: true }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { success: false, error: "errors:passwordRequired" }
  }

  if (password.length < 6) {
    return { success: false, error: "errors:passwordMinLength" }
  }

  return { success: true }
}

/**
 * Validates password confirmation
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): ValidationResult {
  if (!confirmPassword) {
    return { success: false, error: "errors:confirmPasswordRequired" }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "errors:passwordMismatch" }
  }

  return { success: true }
}
