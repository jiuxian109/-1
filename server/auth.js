import crypto from 'node:crypto'

const SECRET = process.env.BAITUAN_SECRET || 'baituan-dev-secret'
const TTL = 24 * 60 * 60 * 1000 // token 24h 过期

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(pw, stored) {
  if (typeof stored !== 'string') return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(String(pw), salt, 32)
  const expect = Buffer.from(hash, 'hex')
  return expect.length === test.length && crypto.timingSafeEqual(test, expect)
}

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TTL })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function bearer(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : ''
}
