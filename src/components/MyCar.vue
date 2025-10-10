<template>
  <div class="mycar-card">
    <div class="header">
      <h3>🚗 My Car</h3>
      <button @click="goToMyCar" class="change-btn">Change</button>
    </div>

    <div v-if="loading" class="loading">Loading your car...</div>

    <div v-else-if="car && car.make" class="car-details">
      <p><strong>Make:</strong> {{ car.make }}</p>
      <p><strong>Model:</strong> {{ car.model }}</p>
      <p>
        <strong>Extra Load:</strong>
        <span v-if="car.extraLoad === 'none'">None</span>
        <span v-else>{{ car.extraLoad }}</span>
      </p>
    </div>

    <div v-else class="no-car">
      <p>No car saved yet.</p>
      <router-link to="/mycar" class="setup-link">Set up now</router-link>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { API_BASE } from '@/config/apiConfig.js';

const router = useRouter();
const car = ref(null);
const loading = ref(true);

onMounted(async () => {
  await loadCar();
});

async function loadCar() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      loading.value = false;
      return;
    }

    const res = await fetch(`${API_BASE}/auth/car`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.car) {
      car.value = data.car;
    }
  } catch (error) {
    console.error('Failed to load car:', error);
  } finally {
    loading.value = false;
  }
}

function goToMyCar() {
  router.push('/mycar');
}</script>

<style scoped>
  .mycar-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 20px auto;
    max-width: 400px;
    transition: all 0.3s;
  }

    .mycar-card:hover {
      transform: translateY(-2px);
    }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .change-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .change-btn:hover {
      background: #0056b3;
    }

  .car-details p {
    margin: 6px 0;
    font-size: 1rem;
    color: #333;
  }

  .no-car {
    text-align: center;
    color: #666;
    font-style: italic;
  }

  .setup-link {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 16px;
    background: #28a745;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
  }

    .setup-link:hover {
      background: #218838;
    }

  .loading {
    text-align: center;
    color: #555;
    font-size: 0.95rem;
  }
</style>
