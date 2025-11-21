/**
 * Phone number utilities for Kenyan phone numbers
 * Handles normalization between local (07XX) and international (254XX) formats
 */

/**
 * Normalize phone to 254 format for API calls
 * Accepts: 07XX, 01XX, 254XX formats
 * @param phone - Phone number in any accepted format
 * @returns Normalized phone number (254XXXXXXXXX)
 */
export const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
        return `254${cleaned.substring(1)}`
    }

    if (cleaned.startsWith('254') && cleaned.length === 12) {
        return cleaned
    }

    throw new Error('Invalid phone format. Use 07XX, 01XX, or 254XX')
}

/**
 * Format phone for display (local format)
 * 254712345678 → 0712345678
 * @param phone - Phone number in 254 format
 * @returns Phone number in local format (07XX)
 */
export const formatPhone = (phone: string): string => {
    const normalized = normalizePhone(phone)
    return `0${normalized.substring(3)}`
}

/**
 * Validate Kenyan phone number
 * @param phone - Phone number to validate
 * @returns true if valid Kenyan phone number
 */
export const isValidKenyanPhone = (phone: string): boolean => {
    try {
        const normalized = normalizePhone(phone)
        return normalized.length === 12 && normalized.startsWith('254')
    } catch {
        return false
    }
}
