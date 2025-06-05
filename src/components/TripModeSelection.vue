<template>
  <div class="trip-mode-selection">
    <h2 class="header">Select Transport Mode</h2>

    <div class="mode-grid">
      <div
        v-for="mode in modes"
        :key="mode.value"
        :class="['mode-card', selectedMode === mode.value ? 'active' : '']"
        @click="handleSelect(mode.value)"
      >
        <div class="icon">{{ mode.icon }}</div>
        <div class="label">{{ mode.label }}</div>
        <button
          v-if="mode.value === 'car' && selectedMode === 'car'"
          class="edit-button"
          @click.stop="goToCarDetails"
        >Edit</button>
      </div>
    </div>

    <button
      v-if="selectedMode && selectedMode !== 'car'"
      class="start-button"
      @click="startTrip"
    >Start Trip</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedMode = ref(null)
const tripId = ref(null)

const modes = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'tram', label: 'Tram', icon: '🚋' },
  { value: 'metro', label: 'Metro', icon: '🚇' },
  { value: 'flight', label: 'Flight', icon: '✈️' },
]

function handleSelect(mode) {
  selectedMode.value = mode
}

function goToCarDetails() {
  router.push({ name: 'CarDetails' })
}


async function startTrip() {
  if (!selectedMode.value) {
    alert('Please select a transport mode')
    return
  }

  const token = localStorage.getItem('authToken')
  console.log('Token exists:', !!token)

  if (!token) {
    alert('Please log in first')
    return
  }

  try {
    const body = { transportMode: selectedMode.value }

    if (selectedMode.value === 'car') {
      body.brand = 'Toyota'
      body.fuel = 'petrol'
      body.factor = 2.31
    }

    console.log('Sending request with body:', body)

    const res = await fetch('https://emissionscalculatorbackend.onrender.com/api/trips/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    console.log('Response status:', res.status)
    console.log('Response ok:', res.ok)

    // Get the response text first to see what the server is actually returning
    const responseText = await res.text()
    console.log('Raw response:', responseText)

    if (!res.ok) {
      // Try to parse as JSON, but handle if it's not valid JSON
      let errorMessage = 'Failed to start trip'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        errorMessage = responseText || errorMessage
      }
      throw new Error(errorMessage)
    }

    const data = JSON.parse(responseText)
    tripId.value = data.tripId
    localStorage.setItem('currentTripId', tripId.value)

    router.push({
      name: 'TripTracking',
      query: { mode: selectedMode.value, tripId: tripId.value }
    })

  } catch (error) {
    console.error('Full error:', error)
    alert('Error starting trip: ' + error.message)
  }
}
</script>

<style scoped>
.trip-mode-selection {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  box-sizing: border-box;
}

.header {
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 600;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  width: 100%;
}

.mode-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: 0.3s;
  position: relative;
}

.mode-card.active {
  background-color: #dbeafe;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.label {
  font-weight: 500;
  font-size: 1rem;
}

.edit-button {
  margin-top: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.start-button {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #10b981;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 24px;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 100;
}
</style>
