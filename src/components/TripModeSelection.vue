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

    <!-- Show start button for all modes -->
    <div v-if="selectedMode" class="action-buttons">
      <button
        v-if="selectedMode === 'car'"
        class="start-button car-start"
        @click="startCarTrip"
      >Start Car Trip</button>

      <button
        v-else
        class="start-button"
        @click="startTrip"
      >Start {{ getModeName(selectedMode) }} Trip</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedMode = ref(null)
const isStartingTrip = ref(false)

const modes = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'tram', label: 'Tram', icon: '🚋' },
  { value: 'metro', label: 'Metro', icon: '🚇' },
  { value: 'flight', label: 'Flight', icon: '✈️' },
]

function handleSelect(mode) {
  selectedMode.value = mode
  console.log('Selected mode:', mode)
}

function getModeName(mode) {
  const modeObj = modes.find(m => m.value === mode)
  return modeObj ? modeObj.label : mode
}

function goToCarDetails() {
  router.push({ name: 'CarDetails' })
}

async function startTrip() {
  if (!selectedMode.value) return

  console.log('Starting trip for mode:', selectedMode.value)

  try {
    isStartingTrip.value = true

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Call the backend to start a trip
    const response = await fetch('https://emissionscalculatorbackend-1.onrender.com/api/trips/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transportMode: selectedMode.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start trip')
    }

    console.log('Trip started successfully:', data)

    // Navigate to the appropriate form with the trip ID
    const formRoute = `/form/${selectedMode.value}`
    router.push({
      path: formRoute,
      query: { tripId: data.tripId }
    })

  } catch (error) {
    console.error('Error starting trip:', error)
    alert('Error starting trip: ' + error.message)
  } finally {
    isStartingTrip.value = false
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
