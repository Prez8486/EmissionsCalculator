<template>
  <div class="trip-summary">
    <h2>Trip Summary</h2>

    <div v-if="loading" class="loading">Loading trip details...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="summary-card">
      <p><strong>Transport Mode:</strong> {{ trip.transportMode }}</p>
      <p><strong>Distance:</strong> {{ trip.distanceKm.toFixed(2) }} km</p>
      <p><strong>Duration:</strong> {{ formattedDuration }}</p>
      <p><strong>Emissions:</strong> {{ trip.emissionKg.toFixed(2) }} kg CO₂e</p>
    </div>

    <button class="start-new-trip-button" @click="startNewTrip">
      Start New Trip
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tripId = route.query.tripId

const loading = ref(true)
const error = ref(null)
const trip = ref({
  transportMode: '',
  distanceKm: 0,
  durationSec: 0,
  emissionKg: 0,
})

const formattedDuration = computed(() => {
  const sec = trip.value.durationSec % 60
  const min = Math.floor((trip.value.durationSec / 60) % 60)
  const hr = Math.floor(trip.value.durationSec / 3600)
  return `${hr}h ${min}m ${sec}s`
})

async function fetchTripDetails() {
  if (!tripId) {
    error.value = 'No trip ID provided.'
    loading.value = false
    return
  }

  const token = localStorage.getItem('authToken')
  if (!token) {
    error.value = 'User not logged in.'
    loading.value = false
    return
  }

  try {
    const res = await fetch(`https://emissionscalculatorbackend.onrender.com/api/trips/${tripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to load trip data')
    }

    const data = await res.json()
    trip.value.transportMode = data.trip.transportMode
    trip.value.distanceKm = data.trip.distanceKm
    trip.value.durationSec = data.trip.durationSec
    trip.value.emissionKg = data.trip.emissionKg
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startNewTrip() {
  router.push({ name: 'TripModeSelection' })
}

onMounted(() => {
  fetchTripDetails()
})
</script>

<style scoped>
.trip-summary {
  padding: 24px;
  text-align: center;
}

.summary-card {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 30px auto;
  width: 80%;
}

.save-button {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 14px 32px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 24px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
</style>
