import admin from 'firebase-admin';

let realtimeDb = null;

function normalizePrivateKey(privateKey) {
  if (!privateKey || typeof privateKey !== 'string') return privateKey;
  return privateKey.replace(/\\n/g, '\n');
}

export function initializeFirebaseRealtime() {
  try {
    if (realtimeDb) return realtimeDb;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const databaseURL = process.env.FIREBASE_DATABASE_URL;

    if (!projectId || !clientEmail || !privateKey || !databaseURL) {
      console.warn('⚠️ Firebase Realtime Database not configured in .env');
      return null;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        }),
        databaseURL
      });
    }

    realtimeDb = admin.database();
    ensureMandatoryCollections().catch((error) => {
      console.warn('⚠️ Failed to ensure mandatory Firebase collections:', error.message);
    });
    console.log('✅ Firebase Realtime Database initialized');
    return realtimeDb;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Realtime Database:', error.message);
    return null;
  }
}

async function ensureMandatoryCollections() {
  const db = getFirebaseRealtimeDb();
  if (!db) return;

  const now = Date.now();
  const requiredNodes = ['users', 'drivers', 'delivery_boys', 'active_orders', 'route_cache'];

  for (const node of requiredNodes) {
    const ref = db.ref(node);
    const snap = await ref.once('value');
    if (!snap.exists()) {
      await ref.set({
        _meta: {
          initialized_at: now,
          mandatory: node === 'users' || node === 'drivers'
        }
      });
    }
  }
}

export function getFirebaseRealtimeDb() {
  if (!realtimeDb) {
    console.warn('⚠️ Firebase Realtime Database not initialized. Call initializeFirebaseRealtime() first.');
    return null;
  }
  return realtimeDb;
}

function toPolylineValue(value) {
  return Math.round(value * 1e5);
}

function encodeSignedNumber(num) {
  let sgnNum = num < 0 ? ~(num << 1) : (num << 1);
  let encoded = '';
  while (sgnNum >= 0x20) {
    encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  encoded += String.fromCharCode(sgnNum + 63);
  return encoded;
}

export function encodePolyline(points = []) {
  if (!Array.isArray(points) || points.length === 0) return '';
  let prevLat = 0;
  let prevLng = 0;
  let result = '';

  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lat = toPolylineValue(Number(point[0]));
    const lng = toPolylineValue(Number(point[1]));
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;
    prevLat = lat;
    prevLng = lng;

    result += encodeSignedNumber(dLat);
    result += encodeSignedNumber(dLng);
  }

  return result;
}

export function makeRouteCacheKey(startLat, startLng, endLat, endLng) {
  const norm = (value) => String(Number(value).toFixed(4)).replace(/\./g, '_').replace(/-/, 'm');
  return `${norm(startLat)}_${norm(startLng)}_${norm(endLat)}_${norm(endLng)}`;
}

export async function upsertDeliveryBoyPresence(boyId, payload = {}) {
  const db = getFirebaseRealtimeDb();
  if (!db || !boyId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    await db.ref(`delivery_boys/${boyId}`).update({
      status: payload.status || 'offline',
      lat: Number(payload.lat) || 0,
      lng: Number(payload.lng) || 0,
      last_updated: payload.last_updated || Date.now()
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to write delivery_boys:', error.message);
    return false;
  }
}

export async function upsertDriverPresence(driverId, payload = {}) {
  const db = getFirebaseRealtimeDb();
  if (!db || !driverId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    const now = Date.now();
    const lat = Number(payload.lat) || 0;
    const lng = Number(payload.lng) || 0;
    const driverKey = `driver_${driverId}`;
    const dateString = new Date(now).toISOString().replace('T', ' ').replace('Z', '');

    await db.ref(`drivers/${driverKey}`).update({
      id: payload.id || driverId,
      name: payload.name || 'Delivery Partner',
      mobile: payload.mobile || '',
      is_active: payload.is_active ?? 1,
      is_available: payload.is_available ?? true,
      l: [lat, lng],
      bearing: Number(payload.bearing) || 0,
      transport_type: payload.transport_type || 'both',
      vehicle_number: payload.vehicle_number || '',
      vehicle_type_name: payload.vehicle_type_name || '',
      vehicle_type_icon: payload.vehicle_type_icon || 'motor_bike',
      date: payload.date || dateString,
      updated_at: payload.updated_at || now
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to write drivers:', error.message);
    return false;
  }
}

export async function upsertUserRealtime(userId, payload = {}) {
  const db = getFirebaseRealtimeDb();
  if (!db || !userId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    await db.ref(`users/${userId}`).update({
      lat: Number(payload.lat) || 0,
      lng: Number(payload.lng) || 0,
      address: payload.address || '',
      area: payload.area || '',
      city: payload.city || '',
      state: payload.state || '',
      formatted_address: payload.formatted_address || '',
      accuracy: payload.accuracy ?? null,
      last_updated: payload.last_updated || Date.now()
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to write users:', error.message);
    return false;
  }
}

export async function upsertActiveOrderTracking(orderId, payload = {}) {
  const db = getFirebaseRealtimeDb();
  if (!db || !orderId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    const existingSnapshot = await db.ref(`active_orders/${orderId}`).once('value');
    const existing = existingSnapshot.val() || {};
    const now = Date.now();

    const routePolyline = payload.polyline || encodePolyline(payload.route_coordinates || []);

    await db.ref(`active_orders/${orderId}`).set({
      ...existing,
      boy_id: payload.boy_id ?? existing.boy_id ?? null,
      boy_lat: Number(payload.boy_lat ?? existing.boy_lat ?? 0),
      boy_lng: Number(payload.boy_lng ?? existing.boy_lng ?? 0),
      customer_lat: Number(payload.customer_lat ?? existing.customer_lat ?? 0),
      customer_lng: Number(payload.customer_lng ?? existing.customer_lng ?? 0),
      restaurant_lat: Number(payload.restaurant_lat ?? existing.restaurant_lat ?? 0),
      restaurant_lng: Number(payload.restaurant_lng ?? existing.restaurant_lng ?? 0),
      distance: Number(payload.distance ?? existing.distance ?? 0),
      duration: Number(payload.duration ?? existing.duration ?? 0),
      polyline: routePolyline || existing.polyline || '',
      status: payload.status || existing.status || 'assigned',
      created_at: existing.created_at || payload.created_at || now,
      last_updated: payload.last_updated || now
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to write active_orders:', error.message);
    return false;
  }
}

export async function updateActiveOrderLocation(orderId, lat, lng) {
  const db = getFirebaseRealtimeDb();
  if (!db || !orderId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    await db.ref(`active_orders/${orderId}`).update({
      boy_lat: Number(lat) || 0,
      boy_lng: Number(lng) || 0,
      last_updated: Date.now()
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to update active order location:', error.message);
    return false;
  }
}

export async function setActiveOrderStatus(orderId, status) {
  const db = getFirebaseRealtimeDb();
  if (!db || !orderId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    await db.ref(`active_orders/${orderId}`).update({
      status,
      last_updated: Date.now()
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to update active order status:', error.message);
    return false;
  }
}

export async function removeActiveOrder(orderId) {
  const db = getFirebaseRealtimeDb();
  if (!db || !orderId) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    await db.ref(`active_orders/${orderId}`).remove();
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to remove active order:', error.message);
    return false;
  }
}

export async function upsertRouteCache(routeKey, payload = {}) {
  const db = getFirebaseRealtimeDb();
  if (!db || !routeKey) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return false;
  }

  try {
    const now = Date.now();
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    await db.ref(`route_cache/${routeKey}`).set({
      distance: Number(payload.distance) || 0,
      duration: Number(payload.duration) || 0,
      polyline: payload.polyline || encodePolyline(payload.route_coordinates || []),
      cached_at: now,
      expires_at: now + ttlMs
    });
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to write route_cache:', error.message);
    return false;
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function findNearestOnlineDeliveryBoy(restaurantLat, restaurantLng, maxDistanceKm = 20) {
  const db = getFirebaseRealtimeDb();
  if (!db) {
    console.warn('⚠️ Firebase Realtime Database not available');
    return null;
  }

  try {
    const snapshot = await db.ref('delivery_boys').orderByChild('status').equalTo('online').once('value');
    const boys = snapshot.val() || {};
    let nearest = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const [boyId, boy] of Object.entries(boys)) {
      if (typeof boy.lat !== 'number' || typeof boy.lng !== 'number') continue;
      const distance = haversineKm(restaurantLat, restaurantLng, boy.lat, boy.lng);
      if (distance <= maxDistanceKm && distance < minDistance) {
        minDistance = distance;
        nearest = {
          boy_id: boyId,
          distance_km: Number(distance.toFixed(3)),
          ...boy
        };
      }
    }

    return nearest;
  } catch (error) {
    console.warn('⚠️ Failed to find nearest delivery boy in Firebase:', error.message);
    return null;
  }
}
