<template>
  <div>
    <div v-if="!isNative" class="container">
      <h2>Select Transport Mode</h2>
      <div class="transport-grid">
        <router-link v-for="mode in modes" :key="mode.value" class="btn" :to="mode.route">
          <i :class="['fas', mode.icon, 'icon']"></i>
          <span class="desc">{{ mode.label }}</span>
        </router-link>
      </div>
    </div>

    <div v-else class="carousel-container">
      <h2 class="carousel-title">Select Transport Mode</h2>
      
      <div class="carousel">
        <button @click="prevMode" class="arrow-btn left-arrow">
          <i class="fas fa-chevron-left"></i>
        </button>

        <div class="carousel-content">
          <div class="carousel-icon">
            <i :class="['fas', currentMode.icon]"></i>
          </div>
          <h3 class="carousel-label">{{ currentMode.label }}</h3>
        </div>

        <button @click="nextMode" class="arrow-btn right-arrow">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <router-link :to="currentMode.route" class="select-button">
        Select Trip
      </router-link>
    </div>
  </div>
</template>

<script>
import { Capacitor } from '@capacitor/core';

export default {
  data() {
    return {
      isNative: false,
      currentIndex: 0,
      modes: [
        { value: 'car', label: 'Add a car trip', icon: 'fa-car', route: '/cartrip' },
        { value: 'bus', label: 'Add a bus journey', icon: 'fa-bus', route: '/form/bus' },
        { value: 'tram', label: 'Add a tram ride', icon: 'fa-subway', route: '/form/tram' },
        { value: 'metro', label: 'Add a metro/subway trip', icon: 'fa-train', route: '/form/metro' },
        { value: 'flight', label: 'Log a flight', icon: 'fa-plane', route: '/form/flight' },
      ]
    };
  },
  computed: {
    currentMode() {
      return this.modes[this.currentIndex];
    }
  },
  methods: {
    nextMode() {
      this.currentIndex = (this.currentIndex + 1) % this.modes.length;
    },
    prevMode() {
      this.currentIndex = (this.currentIndex - 1 + this.modes.length) % this.modes.length;
    }
  },
  created() {
    this.isNative = Capacitor.isNativePlatform();
  }
};
</script>

<style scoped>
/* Website Style */
.container {
  text-align: center;
  margin-top: 3rem;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transport-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  justify-items: center;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2em 1.5em;
  background: #28a745;
  color: white;
  text-decoration: none;
  width: 180px;
  height: 140px;
  border-radius: 10px;
  font-size: 1.3em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}

.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #218838;
}

.icon {
  font-size: 2.4em;
  margin-bottom: 0.5rem;
}

.desc {
  font-size: 0.85em;
  max-width: 140px;
  color: #e2e2e2;
  line-height: 1.2;
}


/* Mobile Style */
.carousel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  padding: 1rem;
}

.carousel-title {
  margin-bottom: 3rem;
  font-size: 1.5rem;
  color: #333;
}

.carousel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
}

.carousel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background-color: #f8f9fa;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.carousel-icon {
  font-size: 4rem;
  color: #007bff;
}

.carousel-label {
  font-size: 1.1rem;
  margin-top: 1rem;
  color: #495057;
}

.arrow-btn {
  background: none;
  border: 2px solid #dee2e6;
  color: #adb5bd;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.arrow-btn:hover {
  background-color: #f1f3f5;
  color: #495057;
}

.select-button {
  margin-top: 3rem;
  padding: 1rem 2rem;
  background: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
  transition: background-color 0.2s ease;
}

.select-button:hover {
  background: #218838;
}
</style>