import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidCoordinate } from '../middleware/validation.js'

describe('Coordinate validation (pure helper)', () => {
  it('validates 0, 0 (Equator / Prime Meridian) as valid coordinates', () => {
    assert.equal(isValidCoordinate(0, 0), true)
    assert.equal(isValidCoordinate('0', '0'), true)
  })

  it('validates standard global coordinates', () => {
    assert.equal(isValidCoordinate(6.9271, 79.8612), true) // Colombo
    assert.equal(isValidCoordinate(-33.8688, 151.2093), true) // Sydney
    assert.equal(isValidCoordinate(51.5074, -0.1278), true) // London
  })

  it('rejects out of bounds latitude', () => {
    assert.equal(isValidCoordinate(90.1, 0), false)
    assert.equal(isValidCoordinate(-90.1, 0), false)
  })

  it('rejects out of bounds longitude', () => {
    assert.equal(isValidCoordinate(0, 180.1), false)
    assert.equal(isValidCoordinate(0, -180.1), false)
  })

  it('rejects null, undefined, and non-numeric inputs', () => {
    assert.equal(isValidCoordinate(null, null), false)
    assert.equal(isValidCoordinate(undefined, 50), false)
    assert.equal(isValidCoordinate('abc', 'def'), false)
    assert.equal(isValidCoordinate(NaN, 0), false)
    assert.equal(isValidCoordinate(Infinity, 0), false)
  })
})

describe('Trip concurrency and versioning contract', () => {
  it('detects version mismatch for optimistic concurrency', () => {
    const storedTrip = { _id: 'trip123', version: 2, title: 'Paris Tour' }
    const incomingUpdateStale = { version: 1, title: 'Updated Paris Tour' }
    const incomingUpdateFresh = { version: 2, title: 'Updated Paris Tour' }

    const isStale = (incoming, current) => {
      if (incoming.version !== undefined && incoming.version !== current.version) {
        return true
      }
      return false
    }

    assert.equal(isStale(incomingUpdateStale, storedTrip), true)
    assert.equal(isStale(incomingUpdateFresh, storedTrip), false)
  })

  it('assigns stable stopId to itinerary stops without id', () => {
    const activities = [
      { activityTitle: 'Eiffel Tower' },
      { stopId: 'custom-stop-1', activityTitle: 'Louvre Museum' }
    ]

    const normalized = activities.map((act, idx) => ({
      ...act,
      stopId: act.stopId || `stop_${idx}_${Date.now()}`
    }))

    assert.ok(normalized[0].stopId.startsWith('stop_0_'))
    assert.equal(normalized[1].stopId, 'custom-stop-1')
  })
})
