import {
  validateEmail,
  validatePhone,
  validateUrl,
  validateStringLength,
  validateRequired,
  validateImageUpload,
  validatePassword,
  validatePasswordConfirmation,
} from "./validation"

describe("validateEmail", () => {
  it("should return success for valid email", () => {
    const result = validateEmail("test@example.com")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty email", () => {
    const result = validateEmail("")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:emailRequired")
  })

  it("should return error for invalid email format", () => {
    const result = validateEmail("invalid-email")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:invalidEmail")
  })

  it("should return error for email without domain", () => {
    const result = validateEmail("test@")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:invalidEmail")
  })
})

describe("validatePhone", () => {
  it("should return success for valid phone number", () => {
    const result = validatePhone("+90 555 123 4567")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return success for empty phone when not required", () => {
    const result = validatePhone("", false)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty phone when required", () => {
    const result = validatePhone("", true)
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:phoneRequired")
  })

  it("should return error for invalid phone format", () => {
    const result = validatePhone("abc123")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:phoneInvalid")
  })

  it("should accept international format", () => {
    const result = validatePhone("+1 (555) 123-4567")
    expect(result.success).toBe(true)
  })
})

describe("validateUrl", () => {
  it("should return success for valid URL with protocol", () => {
    const result = validateUrl("https://example.com")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return success for URL without protocol", () => {
    const result = validateUrl("example.com")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return success for empty URL when not required", () => {
    const result = validateUrl("", false)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty URL when required", () => {
    const result = validateUrl("", true)
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:urlRequired")
  })

  it("should return error for invalid URL", () => {
    const result = validateUrl("invalid url with spaces")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:urlInvalid")
  })
})

describe("validateStringLength", () => {
  it("should return success for valid length", () => {
    const result = validateStringLength("hello", 2, 10)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for string too short", () => {
    const result = validateStringLength("a", 2, 10, "name")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:nameTooShort")
  })

  it("should return error for string too long", () => {
    const result = validateStringLength("very long string", 2, 5, "name")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:nameTooLong")
  })

  it("should handle only minimum length", () => {
    const result = validateStringLength("hello", 2)
    expect(result.success).toBe(true)
  })

  it("should handle only maximum length", () => {
    const result = validateStringLength("hello", undefined, 10)
    expect(result.success).toBe(true)
  })
})

describe("validateRequired", () => {
  it("should return success for non-empty string", () => {
    const result = validateRequired("hello")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty string", () => {
    const result = validateRequired("", "name")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:nameRequired")
  })

  it("should return error for null value", () => {
    const result = validateRequired(null, "name")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:nameRequired")
  })

  it("should return error for undefined value", () => {
    const result = validateRequired(undefined, "name")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:nameRequired")
  })

  it("should return error for empty array", () => {
    const result = validateRequired([], "items")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:itemsRequired")
  })

  it("should return success for non-empty array", () => {
    const result = validateRequired(["item"], "items")
    expect(result.success).toBe(true)
  })
})

describe("validateImageUpload", () => {
  it("should return success for valid image", () => {
    const buffer = new ArrayBuffer(1024)
    const result = validateImageUpload(buffer, "image/png")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty buffer", () => {
    const buffer = new ArrayBuffer(0)
    const result = validateImageUpload(buffer, "image/png")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileEmpty")
  })

  it("should return error for non-image mime type", () => {
    const buffer = new ArrayBuffer(1024)
    const result = validateImageUpload(buffer, "application/pdf")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileNotImage")
  })

  it("should return error for file too large", () => {
    const buffer = new ArrayBuffer(6 * 1024 * 1024) // 6MB
    const result = validateImageUpload(buffer, "image/png", 5)
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileTooLarge")
  })

  it("should return error for unsupported file type", () => {
    const buffer = new ArrayBuffer(1024)
    const result = validateImageUpload(buffer, "image/gif", 5, ["image/png", "image/jpeg"])
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:fileTypeNotSupported")
  })

  it("should accept supported file types", () => {
    const buffer = new ArrayBuffer(1024)
    const result = validateImageUpload(buffer, "image/jpeg")
    expect(result.success).toBe(true)
  })
})

describe("validatePassword", () => {
  it("should return success for valid password", () => {
    const result = validatePassword("password123")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty password", () => {
    const result = validatePassword("")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:passwordRequired")
  })

  it("should return error for password too short", () => {
    const result = validatePassword("12345")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:passwordMinLength")
  })

  it("should accept minimum length password", () => {
    const result = validatePassword("123456")
    expect(result.success).toBe(true)
  })
})

describe("validatePasswordConfirmation", () => {
  it("should return success for matching passwords", () => {
    const result = validatePasswordConfirmation("password123", "password123")
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should return error for empty confirmation", () => {
    const result = validatePasswordConfirmation("password123", "")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:confirmPasswordRequired")
  })

  it("should return error for mismatched passwords", () => {
    const result = validatePasswordConfirmation("password123", "different")
    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:passwordMismatch")
  })
})
