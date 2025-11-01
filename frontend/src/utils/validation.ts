export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value?.trim()) {
    return `${fieldName} is required`
  }
  return null
}

export const validateLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  const length = value.trim().length
  if (length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  if (length > max) {
    return `${fieldName} must be no more than ${max} characters`
  }
  return null
}