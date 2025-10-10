<!--<template>
  <div class="trip-summary">
    <h2>Trip Summary</h2>

    <div class="summary-card">
      <p><strong>Transport Mode:</strong> {{ transportMode }}</p>
      <p><strong>Distance:</strong> {{ distanceKm }} km</p>
      <p><strong>Duration:</strong> {{ formattedDuration }}</p>
    </div>-->
<!--<button class="save-button" @click="saveTrip" :disabled="loading">
  {{ loading ? "Saving..." : "Save Trip" }}
</button>-->
<!--</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
  const props = defineProps({
    tripData: {
      type: Object,
      required: true
    },
    show: {
      type: Boolean,
      default: false
    }
  })
const route = useRoute()
  const router = useRouter()
  const loading = ref(false)

  const transportMode = computed(() => props.tripData?.transportMode || 'N/A')
  const distanceKm = computed(() => props.tripData?.distance || 0)
  const durationMs = computed(() => props.tripData?.duration || 0)
const durationSec = parseInt(route.query.durationSec)



const formattedDuration = computed(() => {
  const totalSec = Math.floor(durationMs.value / 1000)
  const hr = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
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
    const res = await fetch('https://emissionscalculatorbackend.duckdns.org/api/emissions/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transportMode: transportMode.value,
        distanceKm: distanceKm.value,
        durationSec: Math.floor((durationMs.value || 0)/1000),
        emissionKg: Math.max(distanceKm * 0.2, 0.01)
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
</style>-->
<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h2>Trip Summary</h2>

      <div class="summary-card">
        <p><strong>Transport Mode:</strong> {{ tripData.transportMode }}</p>
        <p><strong>Distance:</strong> {{ tripData.distanceDisplay }}</p>
        <p><strong>Duration:</strong> {{ tripData.durationDisplay }}</p>
        <p><strong>Emissions:</strong> {{ tripData.emissionDisplay }}</p>
        <p><strong>Average Speed:</strong> {{ tripData.averageSpeedDisplay }}</p>
      </div>

      <div class="button-row">
        <button class="save-btn" @click="$emit('save')">💾 Save Trip</button>
        <button class="close-btn" @click="$emit('close')">❌ Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    show: Boolean,
    tripData: Object
  });
</script>

<style scoped>
  /* Full-screen dark overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  /* Modal window */
  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 24px 30px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    animation: fadeInUp 0.25s ease;
  }

  /* Summary details */
  .summary-card {
    background: #f7fafc;
    padding: 16px;
    border-radius: 10px;
    margin-top: 15px;
    text-align: left;
    font-size: 15px;
  }

    .summary-card p {
      margin: 6px 0;
    }

  /* Buttons */
  .button-row {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
  }

  .save-btn {
    background-color: #10b981;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    font-weight: bold;
  }

  .close-btn {
    background-color: #ef4444;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    cursor: pointer;
    font-weight: bold;
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
