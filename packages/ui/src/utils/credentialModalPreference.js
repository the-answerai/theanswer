const STORAGE_KEY_PREFIX = 'ta:credentialModal:dismissed:'

const buildKey = (scope) => {
    if (!scope) return null
    return `${STORAGE_KEY_PREFIX}${scope}`
}

export const getCredentialModalDismissed = (scope) => {
    if (typeof window === 'undefined') return false
    const storageKey = buildKey(scope)
    if (!storageKey) return false

    try {
        return window.localStorage.getItem(storageKey) === 'true'
    } catch (error) {
        console.warn('Failed to read credential modal preference:', error)
        return false
    }
}

export const setCredentialModalDismissed = (scope, value) => {
    if (typeof window === 'undefined') return
    const storageKey = buildKey(scope)
    if (!storageKey) return

    try {
        if (value) {
            window.localStorage.setItem(storageKey, 'true')
        } else {
            window.localStorage.removeItem(storageKey)
        }
    } catch (error) {
        console.warn('Failed to persist credential modal preference:', error)
    }
}

export default {
    getCredentialModalDismissed,
    setCredentialModalDismissed
}
