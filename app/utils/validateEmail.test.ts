// RED: Write failing test first
// Now import the function that doesn't exist yet
import { validateEmail } from "./validateEmail"

describe("validateEmail", () => {
  it("should return true for valid email addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true)
    expect(validateEmail("test.email+tag@domain.co.uk")).toBe(true)
    expect(validateEmail("user123@test-domain.org")).toBe(true)
  })

  it("should return false for invalid email addresses", () => {
    expect(validateEmail("invalid-email")).toBe(false)
    expect(validateEmail("user@")).toBe(false)
    expect(validateEmail("@domain.com")).toBe(false)
    expect(validateEmail("user@domain")).toBe(false)
    expect(validateEmail("user space@domain.com")).toBe(false)
  })

  it("should handle edge cases", () => {
    expect(validateEmail("")).toBe(false)
    expect(validateEmail(null as any)).toBe(false)
    expect(validateEmail(undefined as any)).toBe(false)
    expect(validateEmail("   ")).toBe(false)
  })
})
