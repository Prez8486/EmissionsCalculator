<template>
  <div class="trip-tracking">
    <h2>{{ transportModeLabel }} Trip In Progress</h2>

    <div class="info-card">
      <p><strong>Duration:</strong> {{ durationDisplay }}</p>
      <p><strong>Distance:</strong> {{ (totalDistance / 1000).toFixed(2) }} km</p>
    </div>

    <button class="stop-button" @click="stopTrip">Stop Trip</button>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue';

const route = useRoute()
const router = useRouter()
const transportMode = route.query.mode || 'unknown'

const transportModeLabel = transportMode.charAt(0).toUpperCase() + transportMode.slice(1)

const startTime = Date.now()
const duration = ref(0)
const totalDistance = ref(0)

let watchId = null
let lastPosition = null
let intervalId = null

function calculateDistance(pos1, pos2) {
  const toRad = deg => deg * (Math.PI / 180)

  const R = 6371000 // Earth radius in meters
  const dLat = toRad(pos2.lat - pos1.lat)
  const dLon = toRad(pos2.lng - pos1.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pos1.lat)) *
      Math.cos(toRad(pos2.lat)) *
      Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function stopTrip() {
  navigator.geolocation.clearWatch(watchId)
  clearInterval(intervalId)

  const endTime = Date.now()
  const durationMs = endTime - startTime

  router.push({
    name: 'TripSummary',
    query: {
      mode: transportMode,
      distanceKm: (totalDistance.value / 1000).toFixed(2),
      durationSec: Math.floor(durationMs / 1000)
    }
  })
}

const durationDisplay = computed(() => {
  const sec = Math.floor(duration.value % 60)
  const min = Math.floor((duration.value / 60) % 60)
  const hr = Math.floor(duration.value / 3600)
  return `${hr}h ${min}m ${sec}s`
})

onMounted(() => {
  intervalId = setInterval(() => {
    duration.value++
  }, 1000)

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }

      if (lastPosition) {
        const dist = calculateDistance(lastPosition, coords)
        totalDistance.value += dist
      }

      lastPosition = coords
    },
    err => {
      console.error('Geolocation error:', err)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }
  )
})

onBeforeUnmount(() => {
  navigator.geolocation.clearWatch(watchId)
  clearInterval(intervalId)
})
</script>

<style scoped>
.trip-tracking {
  padding: 24px;
  text-align: center;
}

.info-card {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 12px;
  margin: 30px auto;
  width: 80%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stop-button {
  margin-top: 30px;
  background-color: #ef4444;
  color: white;
  padding: 14px 28px;
  font-size: 1.1rem;
  border: none;
  border-radius: 24px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  cursor: pointer;
}
</style>
