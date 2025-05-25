/**
 * Utility functions for handling recording URLs
 */

/**
 * Constructs a full storage URL for a recording filename
 * @param {string} filename - The recording filename
 * @returns {string} The full storage URL
 */
export const getRecordingUrl = (filename) => {
    if (!filename) return null

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${supabaseUrl}/storage/v1/object/public/call-recordings/${filename}`
}

/**
 * Extracts just the filename from a full storage URL or removes prefix
 * @param {string} url - The full storage URL or filename with prefix
 * @returns {string} The clean filename
 */
export const getRecordingFilename = (url) => {
    if (!url) return null

    // If it's a full URL, extract the filename
    if (url.includes('/')) {
        const matches = url.match(/\/([^/]+)$/)
        return matches ? matches[1] : null
    }

    // If it has the old prefix, remove it
    if (url.startsWith('retaildatasystems_')) {
        return url.replace('retaildatasystems_', '')
    }

    // Otherwise return as is
    return url
}

/**
 * Generates a standardized filename for a recording
 * @param {string} callId - The ID of the call (e.g., 1026)
 * @param {string} phoneNumber - The phone number associated with the call
 * @returns {string} - Filename in format: rec-[callId]_[phoneNumber]-[timestamp].mp3
 */
export function generateRecordingFilename(callId, phoneNumber) {
    const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '') // Remove dashes and colons
        .replace(/\.\d+/, '') // Remove milliseconds

    return `rec-${callId}_${phoneNumber}-${timestamp}.mp3`
}
