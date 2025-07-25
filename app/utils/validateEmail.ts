// GREEN: Write minimal code to make tests pass
export function validateEmail(email: string): boolean {
  if (!email?.trim()) return false

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

// REFACTOR: Code is already clean and simple
