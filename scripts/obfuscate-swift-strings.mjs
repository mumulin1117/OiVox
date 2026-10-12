import { randomInt } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const decoder = 'vocalAtlasPhrasePairPulseEarthDialectSync'
const noiseCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const swiftDirectory = resolve('ios/OiVox')

const systemValues = new Set([
  '', 'OiVox', 'oivox', 'Default Configuration',
  'en', 'ar', 'he', 'tr', 'fr', 'de', 'ja', 'ko',
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
  'http', 'https', 'about',
  '..',
  'bundle', 'html', 'jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'heic', 'avif',
  'wav', 'm4a', 'caf', '%02x',
])

const systemContextMarkers = [
  'UIImage(named:',
  'object(forInfoDictionaryKey:',
  'UISceneConfiguration(name:',
  'String(format:',
  'appendingPathExtension(',
]

function encoded(value) {
  const characters = Array.from(value)
  let result = ''
  for (let index = 0; index < characters.length; index += 1) {
    result += characters[index]
    if (index < characters.length - 1) result += noiseCharacters[randomInt(noiseCharacters.length)]
  }
  return result
}

function decoded(value) {
  return Array.from(value).filter((_character, index) => index % 2 === 0).join('')
}

function shouldProtect(value, line, prefix) {
  if (Array.from(value).length < 2) return false
  if (systemValues.has(value)) return false
  if (value.includes('OiVox')) return false
  if (/^data:image\//i.test(value)) return false
  if (/\.(?:png|jpe?g|gif|webp|svg|heic|avif)(?:[?#].*)?$/i.test(value)) return false
  if (/^(?:public\.|application\/|audio\/|video\/|image\/)/i.test(value)) return false
  if (systemContextMarkers.some((marker) => line.includes(marker))) return false
  if (new RegExp(`${decoder}\\(\\s*$`).test(prefix)) return false
  return true
}

function protectErrorCodeEnum(source) {
  return source.replace(/enum toneMapLink: String \{ case ([^\n]+) \}/, (_match, body) => {
    const entries = body.split(',').map((entry) => {
      const parsed = entry.trim().match(/^(\w+)\s*=\s*"([^"]+)"$/)
      if (!parsed) throw new Error(`Unable to parse BridgeError code: ${entry}`)
      return { name: parsed[1], value: parsed[2] }
    })
    const cases = entries.map(({ name }) => `        case ${name}`).join('\n')
    const values = entries.map(({ name, value }) => `            case .${name}: return ${decoder}("${encoded(value)}")`).join('\n')
    return `enum toneMapLink {\n${cases}\n\n        var rawValue: String {\n            switch self {\n${values}\n            }\n        }\n    }`
  })
}

function skipLineComment(source, start) {
  const end = source.indexOf('\n', start + 2)
  return end < 0 ? source.length : end
}

function skipBlockComment(source, start) {
  let cursor = start + 2
  let depth = 1
  while (cursor < source.length && depth > 0) {
    if (source.startsWith('/*', cursor)) { depth += 1; cursor += 2; continue }
    if (source.startsWith('*/', cursor)) { depth -= 1; cursor += 2; continue }
    cursor += 1
  }
  return cursor
}

function skipTripleString(source, start) {
  const end = source.indexOf('"""', start + 3)
  return end < 0 ? source.length : end + 3
}

function skipRawString(source, start) {
  let hashes = 0
  while (source[start + hashes] === '#') hashes += 1
  if (source[start + hashes] !== '"') return start + 1
  const closing = `"${'#'.repeat(hashes)}`
  const end = source.indexOf(closing, start + hashes + 1)
  return end < 0 ? source.length : end + closing.length
}

function skipInterpolation(source, start) {
  let cursor = start
  let depth = 1
  while (cursor < source.length && depth > 0) {
    if (source.startsWith('//', cursor)) { cursor = skipLineComment(source, cursor); continue }
    if (source.startsWith('/*', cursor)) { cursor = skipBlockComment(source, cursor); continue }
    if (source.startsWith('"""', cursor)) { cursor = skipTripleString(source, cursor); continue }
    if (source[cursor] === '"') {
      cursor += 1
      while (cursor < source.length) {
        if (source[cursor] === '\\') { cursor += 2; continue }
        if (source[cursor] === '"') { cursor += 1; break }
        cursor += 1
      }
      continue
    }
    if (source[cursor] === '(') depth += 1
    if (source[cursor] === ')') depth -= 1
    cursor += 1
  }
  return cursor
}

function transformSwift(source) {
  source = protectErrorCodeEnum(source)
  let result = ''
  let cursor = 0
  let transformedCount = 0

  while (cursor < source.length) {
    if (source.startsWith('//', cursor)) {
      const end = skipLineComment(source, cursor)
      result += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (source.startsWith('/*', cursor)) {
      const end = skipBlockComment(source, cursor)
      result += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (source.startsWith('"""', cursor)) {
      const end = skipTripleString(source, cursor)
      result += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (source[cursor] === '#') {
      const end = skipRawString(source, cursor)
      if (end > cursor + 1) {
        result += source.slice(cursor, end)
        cursor = end
        continue
      }
    }
    if (source[cursor] !== '"') {
      result += source[cursor]
      cursor += 1
      continue
    }

    const start = cursor
    cursor += 1
    let hasEscape = false
    while (cursor < source.length) {
      if (source[cursor] === '\\') {
        hasEscape = true
        if (source[cursor + 1] === '(') {
          cursor = skipInterpolation(source, cursor + 2)
          continue
        }
        cursor += 2
        continue
      }
      if (source[cursor] === '"') { cursor += 1; break }
      cursor += 1
    }

    const literal = source.slice(start, cursor)
    const value = literal.slice(1, -1)
    const lineStart = source.lastIndexOf('\n', start - 1) + 1
    const lineEndCandidate = source.indexOf('\n', cursor)
    const lineEnd = lineEndCandidate < 0 ? source.length : lineEndCandidate
    const line = source.slice(lineStart, lineEnd)
    const prefix = source.slice(Math.max(0, start - decoder.length - 12), start)

    if (!hasEscape && shouldProtect(value, line, prefix)) {
      result += `${decoder}("${encoded(value)}")`
      transformedCount += 1
    } else {
      result += literal
    }
  }

  return { source: result, transformedCount }
}

const restoreOnly = process.argv.includes('--restore')

for (const name of readdirSync(swiftDirectory).filter((value) => value.endsWith('.swift')).sort()) {
  const path = resolve(swiftDirectory, name)
  const original = readFileSync(path, 'utf8')
  if (restoreOnly) {
    const restored = original.replace(new RegExp(`${decoder}\\("([^"\\\\]*)"\\)`, 'g'), (_match, value) => `"${decoded(value)}"`)
    if (restored !== original) writeFileSync(path, restored)
    process.stdout.write(`${name}: restored\n`)
    continue
  }
  const transformed = transformSwift(original)
  if (transformed.source !== original) writeFileSync(path, transformed.source)
  process.stdout.write(`${name}: ${transformed.transformedCount}\n`)
}
