import type { AuthSession } from './api'

export const SESSION_KEY = 'qassure.session'

export function readSafeSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const value = JSON.parse(raw) as Partial<AuthSession> | null
    const user = value?.user
    const expiresAt = typeof value?.expiresAtUtc === 'string' ? Date.parse(value.expiresAtUtc) : Number.NaN

    const valid = Boolean(
      value &&
      typeof value.accessToken === 'string' && value.accessToken.length > 0 &&
      typeof value.expiresAtUtc === 'string' &&
      Number.isFinite(expiresAt) && expiresAt > Date.now() &&
      user &&
      typeof user.id === 'string' &&
      typeof user.email === 'string' &&
      typeof user.displayName === 'string' &&
      typeof user.role === 'string',
    )

    if (!valid) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return value as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}
