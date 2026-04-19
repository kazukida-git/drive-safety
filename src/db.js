import { openDB } from 'idb'

const DB_NAME = 'drivesafety-db'
const DB_VERSION = 1
const STORE_NAME = 'trips'

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('startTime', 'startTime')
        store.createIndex('driverId', 'driverId')
        store.createIndex('syncStatus', 'syncStatus')
      }
    },
  })
}

export async function saveTrip(trip) {
  const db = await getDB()
  await db.put(STORE_NAME, trip)
}

export async function getAllTrips() {
  const db = await getDB()
  const trips = await db.getAll(STORE_NAME)
  return trips.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
}

export async function getTrip(id) {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export async function deleteTrip(id) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

export async function getUnsyncedTrips() {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const index = tx.store.index('syncStatus')
  return index.getAll('local')
}
