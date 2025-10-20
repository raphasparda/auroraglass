import type { CardBrand, ViaCEPResponse } from "./form-types"

// Input masking functions
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1")
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1")
}

export function maskCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim()
    .substring(0, 19)
}

export function maskCardExpiry(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\/\d{2})\d+?$/, "$1")
}

export function maskCVV(value: string): string {
  return value.replace(/\D/g, "").substring(0, 4)
}

// Card validation
export function detectCardBrand(cardNumber: string): CardBrand {
  const cleaned = cardNumber.replace(/\s/g, "")
  if (/^4/.test(cleaned)) return "visa"
  if (/^5[1-5]/.test(cleaned)) return "mastercard"
  if (/^3[47]/.test(cleaned)) return "amex"
  return "unknown"
}

export function validateLuhn(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, "")
  if (!/^\d+$/.test(cleaned)) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cleaned[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Password strength
export function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  return Math.min(strength, 5)
}

export function getPasswordStrengthLabel(strength: number): string {
  const labels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"]
  return labels[strength - 1] || "Muito fraca"
}

export function getPasswordStrengthColor(strength: number): string {
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"]
  return colors[strength - 1] || "bg-gray-300"
}

// API calls
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const unavailableEmails = ["test@example.com", "admin@example.com"]
    return !unavailableEmails.includes(email.toLowerCase())
  } catch (error) {
    console.error("Error checking email availability:", error)
    return true // Assume available on error
  }
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, "")
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)

    if (!response.ok) {
      throw new Error("Failed to fetch address")
    }

    const data: ViaCEPResponse = await response.json()

    if (data.erro) {
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching address:", error)
    return null
  }
}

// PIX QR Code generation
export function generatePixQRCode(pixKey: string): string {
  // Simplified QR code generation for demo
  const payload = `00020126${pixKey.length.toString().padStart(2, "0")}${pixKey}5204000053039865802BR`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`
}

export function generateFakePixCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = "00020126"

  // Generate random segments
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (i < 3) code += "."
  }

  return code
}

// LocalStorage helpers with SSR safety
export function saveFormData(data: Partial<any>): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("auroraFormData", JSON.stringify(data))
  } catch (error) {
    console.error("Error saving form data:", error)
  }
}

export function loadFormData(): Partial<any> | null {
  if (typeof window === "undefined") return null

  try {
    const saved = localStorage.getItem("auroraFormData")
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error("Error loading form data:", error)
    return null
  }
}

export function clearFormData(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("auroraFormData")
  } catch (error) {
    console.error("Error clearing form data:", error)
  }
}
