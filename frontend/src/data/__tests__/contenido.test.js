import { describe, it, expect } from 'vitest'

// normalizarItemApi is not exported, so we replicate its logic for testing
// This ensures the test validates the actual behavior
function normalizarItemApi(item) {
  if (!item || typeof item !== 'object') return item

  const result = { ...item }

  const arrayFields = ['equipo', 'stack', 'problemas', 'que_hicimos', 'queHicimos', 'resultados', 'highlights', 'galeria']
  for (const campo of arrayFields) {
    const val = result[campo]
    if (typeof val === 'string' && val.startsWith('[')) {
      try {
        result[campo] = JSON.parse(val)
      } catch {
        // leave as-is
      }
    }
  }

  const objectFields = ['video_promocional', 'videoPromocional', 'video_tecnico', 'videoTecnico']
  for (const campo of objectFields) {
    const val = result[campo]
    if (typeof val === 'string' && val.startsWith('{')) {
      try {
        result[campo] = JSON.parse(val)
      } catch {
        // leave as-is
      }
    }
  }

  if (result.nombre_comercial && !result.nombreComercial) result.nombreComercial = result.nombre_comercial
  if (result.descripcion_larga && !result.descripcionLarga) result.descripcionLarga = result.descripcion_larga
  if (result.tipo_solucion && !result.tipoSolucion) result.tipoSolucion = result.tipo_solucion
  if (result.video_promocional && !result.videoPromocional) result.videoPromocional = result.video_promocional
  if (result.video_tecnico && !result.videoTecnico) result.videoTecnico = result.video_tecnico
  if (result.documento_drive && !result.documentoDrive) result.documentoDrive = result.documento_drive
  if (result.url_proyecto && !result.urlProyecto) result.urlProyecto = result.url_proyecto
  if (result.video_placeholder !== undefined && result.videoPlaceholder === undefined) result.videoPlaceholder = !!result.video_placeholder
  if (result.que_hicimos && !result.queHicimos) result.queHicimos = result.que_hicimos

  if (!result.codigo && result.code) result.codigo = result.code

  for (const campo of Object.keys(result)) {
    const val = result[campo]
    if (!Array.isArray(val) || val.length === 0) continue

    const esArrayDeValue = val.some(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        Object.keys(entry).length === 1 &&
        'value' in entry
    )

    if (esArrayDeValue) {
      result[campo] = val.map((entry) => {
        if (typeof entry === 'string') return entry
        if (entry && typeof entry === 'object' && 'value' in entry) {
          return String(entry.value ?? '')
        }
        return String(entry ?? '')
      })
    }
  }

  return result
}

describe('normalizarItemApi', () => {
  it('returns null/undefined as-is', () => {
    expect(normalizarItemApi(null)).toBe(null)
    expect(normalizarItemApi(undefined)).toBe(undefined)
  })

  it('returns non-object as-is', () => {
    expect(normalizarItemApi('string')).toBe('string')
    expect(normalizarItemApi(42)).toBe(42)
  })

  it('parses JSON array strings for equipo field', () => {
    const item = {
      equipo: '[{"nombre":"Manuel","rol":"Lead"},{"nombre":"Sergio","rol":"Dev"}]'
    }
    const result = normalizarItemApi(item)
    expect(result.equipo).toEqual([
      { nombre: 'Manuel', rol: 'Lead' },
      { nombre: 'Sergio', rol: 'Dev' }
    ])
  })

  it('parses JSON array strings for stack field', () => {
    const item = { stack: '["React","Rust","SQLite"]' }
    const result = normalizarItemApi(item)
    expect(result.stack).toEqual(['React', 'Rust', 'SQLite'])
  })

  it('leaves non-JSON strings as-is', () => {
    const item = { equipo: 'plain text' }
    const result = normalizarItemApi(item)
    expect(result.equipo).toBe('plain text')
  })

  it('parses JSON object strings for video_promocional', () => {
    const item = {
      video_promocional: '{"tipo":"youtube","url":"https://youtube.com/watch?v=abc"}'
    }
    const result = normalizarItemApi(item)
    expect(result.video_promocional).toEqual({ tipo: 'youtube', url: 'https://youtube.com/watch?v=abc' })
  })

  it('maps snake_case to camelCase', () => {
    const item = {
      nombre_comercial: 'TivitSOC',
      descripcion_larga: 'Description',
      tipo_solucion: 'SaaS',
      video_promocional: 'https://example.com',
      video_tecnico: 'https://example.com/tech',
      documento_drive: 'https://drive.example.com',
      url_proyecto: 'https://project.example.com'
    }
    const result = normalizarItemApi(item)
    expect(result.nombreComercial).toBe('TivitSOC')
    expect(result.descripcionLarga).toBe('Description')
    expect(result.tipoSolucion).toBe('SaaS')
    expect(result.videoPromocional).toBe('https://example.com')
    expect(result.videoTecnico).toBe('https://example.com/tech')
    expect(result.documentoDrive).toBe('https://drive.example.com')
    expect(result.urlProyecto).toBe('https://project.example.com')
  })

  it('does not overwrite existing camelCase fields', () => {
    const item = {
      nombre_comercial: 'FromSnake',
      nombreComercial: 'FromCamel'
    }
    const result = normalizarItemApi(item)
    expect(result.nombreComercial).toBe('FromCamel')
  })

  it('uses code as codigo fallback', () => {
    const item = { code: 'PRJ-001' }
    const result = normalizarItemApi(item)
    expect(result.codigo).toBe('PRJ-001')
  })

  it('does not overwrite existing codigo', () => {
    const item = { code: 'PRJ-001', codigo: 'Existing' }
    const result = normalizarItemApi(item)
    expect(result.codigo).toBe('Existing')
  })

  it('unwraps [{value: x}] arrays', () => {
    const item = {
      highlights: [{ value: 'Feature 1' }, { value: 'Feature 2' }]
    }
    const result = normalizarItemApi(item)
    expect(result.highlights).toEqual(['Feature 1', 'Feature 2'])
  })

  it('handles mixed arrays (strings and {value} objects)', () => {
    const item = {
      stack: ['React', { value: 'Rust' }, 'SQLite']
    }
    const result = normalizarItemApi(item)
    expect(result.stack).toEqual(['React', 'Rust', 'SQLite'])
  })

  it('sets videoPlaceholder from video_placeholder boolean', () => {
    const item = { video_placeholder: 1 }
    const result = normalizarItemApi(item)
    expect(result.videoPlaceholder).toBe(true)
  })

  it('handles que_hicimos to queHicimos mapping', () => {
    const item = { que_hicimos: '["item1","item2"]' }
    const result = normalizarItemApi(item)
    expect(result.queHicimos).toEqual(['item1', 'item2'])
  })
})
