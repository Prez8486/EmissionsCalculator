<template>
  <div class="mycar-form">
    <h2>🚗 My Car Setup</h2>

    <!-- Car Make -->
    <div class="form-group">
      <label>Make</label>
      <select v-model="car.make" @change="loadModels">
        <option value="">Select make</option>
        <option v-for="m in makes" :key="m.make" :value="m.make">
          {{ m.make }}
        </option>
      </select>
    </div>

    <!-- Car Model -->
    <div class="form-group">
      <label>Model</label>
      <select v-model="car.model" :disabled="!car.make">
        <option value="">Select model</option>
        <option v-for="mod in models" :key="mod.model" :value="mod.model">
          {{ mod.model }}
        </option>
      </select>
    </div>

    <!-- Extra Load -->
    <div class="form-group">
      <label>Extra Load</label>
      <select v-model="car.extraLoad">
        <option value="none">None</option>
        <option value="caravan">Caravan</option>
        <option value="boat">Boat</option>
        <option value="trailer-light">Trailer (Light)</option>
        <option value="trailer-medium">Trailer (Medium)</option>
        <option value="trailer-heavy">Trailer (Heavy)</option>
      </select>
    </div>

    <!-- Save Button -->
    <button @click="saveCar" class="save-btn" :disabled="loading">
      {{ loading ? 'Saving...' : 'Save Car' }}
    </button>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { API_BASE } from '@/config/apiConfig.js'

  const router = useRouter()
  const makes = ref([])
  const models = ref([])
  const car = ref({ make: '', model: '', extraLoad: 'none' })
  const loading = ref(false)

  // Load all car makes from API
  async function loadMakes() {
    try {
      const res = await fetch(`${API_BASE}/emissions/car/makes`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      makes.value = data.data || []
    } catch (err) {
      console.error('Failed to load makes:', err)
      alert('❌ Could not fetch car makes. Please try again.')
    }
  }

  // Load models for selected make
  async function loadModels() {
    try {
      models.value = []
      if (!car.value.make) return
      const res = await fetch(
        `${API_BASE}/emissions/car/models/${encodeURIComponent(car.value.make)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      models.value = data.data || []
    } catch (err) {
      console.error('Failed to load models:', err)
      alert('❌ Could not fetch car models. Please try again.')
    }
  }

  // Load user’s saved car info from backend
  async function loadSavedCar() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${API_BASE}/auth/car`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.car) {
        car.value = data.car
        // Optionally preload models for this make
        if (car.value.make) await loadModels()
      }
    } catch (err) {
      console.error('Failed to fetch saved car:', err)
    }
  }

  // Save user’s selected car to backend
  async function saveCar() {
    if (!car.value.make || !car.value.model) {
      alert('Please select both make and model')
      return
    }

    loading.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please log in first')
      loading.value = false
      return
    }

    try {
      const res = await fetch(`${API_BASE}/auth/car`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(car.value)
      })

      const data = await res.json()
      if (res.ok) {
        alert('✅ Car saved successfully!')
        setTimeout(() => {
          router.push('/home')
        },1000)
      } else {
        alert('❌ ' + data.error)
      }
    } catch (err) {
      console.error('Error saving car:', err)
      alert('❌ Failed to save car. Please try again.')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadMakes()
    await loadSavedCar()
  })
</script>

<style scoped>
  .mycar-form {
    max-width: 500px;
    margin: 40px auto;
    padding: 20px;
    background: #f9fafb;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

    .mycar-form h2 {
      text-align: center;
      color: #333;
      margin-bottom: 25px;
    }

  .form-group {
    margin-bottom: 16px;
  }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 6px;
      color: #444;
    }

    .form-group select {
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
      font-size: 15px;
    }

  .save-btn {
    width: 100%;
    background: #10b981;
    color: white;
    border: none;
    padding: 12px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
  }

    .save-btn:hover:not(:disabled) {
      background: #059669;
    }

    .save-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }
</style>
