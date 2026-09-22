import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, 64)
  return `scrypt:${salt.toString('base64url')}:${Buffer.from(derived).toString('base64url')}`
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, saltText, hashText] = String(storedHash).split(':')
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false
  const expected = Buffer.from(hashText, 'base64url')
  const actual = Buffer.from(await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function createAccessToken() {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
