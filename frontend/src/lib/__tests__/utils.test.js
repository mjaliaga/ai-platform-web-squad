import { describe, it, expect } from 'vitest'
import { iniciales, esVideoPlaceholder } from '../utils.js'

describe('iniciales', () => {
  it('returns initials from full name', () => {
    expect(iniciales('Manuel Aliaga')).toBe('MA')
  })

  it('returns single initial for single name', () => {
    expect(iniciales('Manuel')).toBe('M')
  })

  it('returns max 2 initials for 3+ word names', () => {
    expect(iniciales('Juan Carlos Perez')).toBe('JC')
  })

  it('handles empty string', () => {
    expect(iniciales('')).toBe('')
  })

  it('handles null/undefined', () => {
    expect(iniciales(null)).toBe('')
    expect(iniciales(undefined)).toBe('')
  })

  it('handles extra whitespace', () => {
    expect(iniciales('  Manuel   Aliaga  ')).toBe('MA')
  })
})

describe('esVideoPlaceholder', () => {
  it('returns true for null/undefined', () => {
    expect(esVideoPlaceholder(null)).toBe(true)
    expect(esVideoPlaceholder(undefined)).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(esVideoPlaceholder('')).toBe(true)
  })

  it('returns true for assistdev-demo URLs', () => {
    expect(esVideoPlaceholder('https://assistdev-demo.example.com')).toBe(true)
  })

  it('returns true for auditia-demo URLs', () => {
    expect(esVideoPlaceholder('https://auditia-demo.example.com')).toBe(true)
  })

  it('returns false for real YouTube URLs', () => {
    expect(esVideoPlaceholder('https://www.youtube.com/watch?v=abc123')).toBe(false)
  })

  it('handles object with url property', () => {
    expect(esVideoPlaceholder({ url: 'https://www.youtube.com/watch?v=abc123' })).toBe(false)
    expect(esVideoPlaceholder({ url: 'https://assistdev-demo.example.com' })).toBe(true)
  })

  it('handles object without url', () => {
    expect(esVideoPlaceholder({ tipo: 'youtube' })).toBe(true)
  })
})
