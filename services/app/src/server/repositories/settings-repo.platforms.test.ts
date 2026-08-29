import { describe, expect, it } from 'vitest'
import { coerceMessengerPlatforms } from '@/server/repositories/settings-repo'

describe('coerceMessengerPlatforms', () => {
  it('parses Postgres enum-array literal strings from node-pg', () => {
    expect(coerceMessengerPlatforms('{telegram,bale}')).toEqual([
      'telegram',
      'bale',
    ])
    expect(coerceMessengerPlatforms('{telegram,bale,rubika}')).toEqual([
      'telegram',
      'bale',
      'rubika',
    ])
    expect(coerceMessengerPlatforms('{}')).toEqual([])
  })

  it('accepts JS arrays and sorts into canonical order', () => {
    expect(coerceMessengerPlatforms(['bale', 'telegram'])).toEqual([
      'telegram',
      'bale',
    ])
  })

  it('ignores unknown values', () => {
    expect(coerceMessengerPlatforms('{telegram,foo}')).toEqual(['telegram'])
    expect(coerceMessengerPlatforms(null)).toEqual([])
    expect(coerceMessengerPlatforms(undefined)).toEqual([])
  })
})
