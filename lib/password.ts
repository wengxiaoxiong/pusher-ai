import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false
  }

  const [salt, key] = storedHash.split(":")
  if (!salt || !key) {
    return false
  }

  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex")
  const derivedBuffer = Buffer.from(derived, "hex")
  const keyBuffer = Buffer.from(key, "hex")
  if (derivedBuffer.length !== keyBuffer.length) {
    return false
  }
  return timingSafeEqual(derivedBuffer, keyBuffer)
}
