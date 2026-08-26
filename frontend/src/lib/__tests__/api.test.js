import { describe, it, expect } from 'vitest'
import { unwrapPaginated } from '../api.js'

describe('unwrapPaginated', () => {
  it('returns array if response is already an array', () => {
    const data = [{ id: 1 }, { id: 2 }]
    expect(unwrapPaginated(data)).toEqual(data)
  })

  it('unwraps items from paginated response', () => {
    const resp = { items: [{ id: 1 }, { id: 2 }], total: 2, limit: 10, offset: 0 }
    expect(unwrapPaginated(resp)).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('returns empty array for null/undefined', () => {
    expect(unwrapPaginated(null)).toEqual([])
    expect(unwrapPaginated(undefined)).toEqual([])
  })

  it('returns empty array for empty object', () => {
    expect(unwrapPaginated({})).toEqual([])
  })

  it('returns empty array for paginated response with empty items', () => {
    expect(unwrapPaginated({ items: [], total: 0 })).toEqual([])
  })

  it('handles response with extra fields', () => {
    const resp = { items: [{ id: 1 }], total: 1, limit: 10, offset: 0, meta: 'extra' }
    expect(unwrapPaginated(resp)).toEqual([{ id: 1 }])
  })
})
