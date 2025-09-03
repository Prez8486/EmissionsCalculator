<template>
  <div class="trip-summary">
    <h2>Trip Summary</h2>

    <div class="summary-card">
      <p><strong>Transport Mode:</strong> {{ transportMode }}</p>
      <p><strong>Distance:</strong> {{ distanceKm }} km</p>
      <p><strong>Duration:</strong> {{ formattedDuration }}</p>
    </div>

    <button class="save-button" @click="saveTrip" :disabled="loading">
      {{ loading ? "Saving..." : "Save Trip" }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const transportMode = route.query.mode
const distanceKm = parseFloat(route.query.distanceKm)
const durationSec = parseInt(route.query.durationSec)

const loading = ref(false)

const formattedDuration = computed(() => {
  const sec = durationSec % 60
  const min = Math.floor((durationSec / 60) % 60)
  const hr = Math.floor(durationSec / 3600)
  return `${hr}h ${min}m ${sec}s`
})

async function saveTrip() {
  loading.value = true

  const token = localStorage.getItem('token')
  if (!token) {
    alert("You must be logged in.")
    router.push('/login')
    return
  }

  try {
    const res = await fetch('https://emissionscalculatorbackend.onrender.com/api/trips/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transportMode,
        distanceKm,
        durationSec
      })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Trip saved successfully!")
      router.push('/home')
    } else {
      alert("Error saving trip: " + data.error)
    }
  } catch (err) {
    console.error(err)
    alert("Failed to save trip.")
  } finally {
    loading.value = false
  }
}
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
