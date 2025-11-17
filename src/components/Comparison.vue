<template>
  <div class="comparison-page">
    <h1 class="title">Comparison Page</h1>

    <MyCarCard />

    <!-- Debug info (remove after fixing) -->
    <div class="debug-info" style="background: #fef3c7; padding: 10px; margin: 10px; border-radius: 8px;">
      <p><strong>Debug:</strong></p>
      <p>userCar: {{ userCar ? `${userCar.make} ${userCar.model}` : 'null' }}</p>
      <p>User Car Emissions: {{ userCarEmissions }}</p>
    </div>

    <!-- Change Car Section -->
    <section class="change-car">
      <h2>Change Car</h2>
      <div class="car-scroll-container">
        <!-- Left Arrow -->
        <button
          class="scroll-btn left"
          @click="scrollLeft"
          :disabled="!canScrollLeft"
        >
          ‹
        </button>

        <!-- Scrollable Car Cards -->
        <div class="car-scroll" ref="carScroll">
          <div
            v-for="(car, index) in cars"
            :key="car.name"
            class="car-card"
          >
            <img :src="car.image" :alt="car.name" class="car-image" />
            <h3 class="car-name">{{ car.name }}</h3>
            <p><strong>Base Emissions:</strong> {{ car.baseEmissions }} g/km</p>
            
            <template v-if="isComparisonReady">
              <p v-if="calculateComparison(car).savings > 0">
                <strong>Emission Savings:</strong> {{ calculateComparison(car).savings.toFixed(1) }} g/km
              </p>
              <p v-if="calculateComparison(car).distance">
                <strong>Distance until net positive:</strong> {{ calculateComparison(car).distance.toLocaleString() }} km
              </p>
              <p v-else-if="calculateComparison(car).message" class="warning">
                {{ calculateComparison(car).message }}
              </p>
            </template>

            <p v-else class="loading-emissions">
              {{ car ? 'Calculating comparison...' : 'Please set up your car first' }}
            </p>
            
            <!--<p v-else class="loading-emissions">Loading comparison...</p>-->
          </div>

          <!-- Custom car option -->
          <div class="car-card custom-car">
            <button @click="compareCustomCar">+ Compare Custom Car</button>
          </div>
        </div>

        <!-- Right Arrow -->
        <button
          class="scroll-btn right"
          @click="scrollRight"
          :disabled="!canScrollRight"
        >
          ›
        </button>
      </div>
    </section>

    <!-- Switch transport options -->
    <section class="switch-options">
      <!-- Public Transport -->
      <div class="switch-option">
        <h2>Switch to Public Transport</h2>
        <div class="transport-img">
          <img src='/src/assets/train.jpg' alt="Public Transport" />
        </div>
        <p>Change a regular trip to public transport. Enter your weekly km:</p>
        <form @submit.prevent="calcSavings('public')">
          <input v-model.number="publicKm" type="number" min="0" placeholder="Weekly km" />
          <button type="submit">Calculate</button>
        </form>
        <p v-if="publicSavings !== null">
          Estimated savings/week: <strong>{{ publicSavings.toFixed(2) }} kg CO₂</strong>
        </p>
      </div>

      <!-- Cycling -->
      <div class="switch-option">
        <h2>Switch to Cycling</h2>
        <div class="transport-img">
          <img src='/src/assets/bicycle.jpg' alt="Cycling" />
        </div>
        <p>Change a regular trip to cycling. Enter your weekly km:</p>
        <form @submit.prevent="calcSavings('cycling')">
          <input v-model.number="cyclingKm" type="number" min="0" placeholder="Weekly km" />
          <button type="submit">Calculate</button>
        </form>
        <p v-if="cyclingSavings !== null">
          Estimated savings/week: <strong>{{ cyclingSavings.toFixed(2) }} kg CO₂</strong>
        </p>
        <small>Maybe include info about safe cycling infrastructure.</small>
      </div>
    </section>

    <!-- Best Low Emission Cars -->
    <div class="top-cars-table">
      <h2>Top 20 CO₂ Performing Vehicles in Australia</h2>
      <p>According to <a href="https://www.greenvehicleguide.gov.au/">Australian Government Green Vehicle Guide</a></p>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Vehicle</th>
            <th>Avg Emissions (g/km)(placeholder)</th>
          </tr>
        </thead>
          <tbody>
              <tr v-for="(car, index) in top_cars" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <a :href="car.link" target="_blank" rel="noopener noreferrer">
                {{ car.name }}
              </a>
            </td>
            <td>{{ car.emissions }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { API_BASE } from '@/config/apiConfig.js';

  const router = useRouter();
  const car = ref(null);
  const loading = ref(true);

  onMounted(async () => {
    await loadCar();
  });

  // Watch for car changes and update window.userCar
  watch(car, (newCar) => {
    if (newCar) {
      console.log('Car loaded in setup:', newCar);
      window.userCar = newCar;
      // Trigger a custom event that the Options API can listen to
      window.dispatchEvent(new CustomEvent('carLoaded', { detail: newCar }));
    }
  }, { immediate: true });

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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      if (data.car) {
        car.value = data.car;
        console.log('Car data loaded:', data.car);
      }
    } catch (error) {
      console.error('Failed to load car:', error);
    } finally {
      loading.value = false;
    }
  }
</script>

<script>
  import MyCarCard from '@/components/MyCar.vue';
  import { API_BASE } from '@/config/apiConfig.js';
  export default {
    async mounted() {
      console.log('Component mounted');

      const container = this.$refs.carScroll;
      if (container) {
        container.addEventListener('scroll', this.checkScrollPosition);
        this.checkScrollPosition();
      }
      
      // Wait for car data with retry logic
      let attempts = 0;
      const maxAttempts = 10;
      
      while (typeof window !== 'undefined' && !window.userCar && attempts < maxAttempts) {
        console.log(`Waiting for car data... attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (window.userCar) {
        console.log('Car data found:', window.userCar);
        if (!window.userCar) {
          console.warn("window.userCar is still undefined after waiting");
          return;
        }
        this.userCar = window.userCar;
        await this.fetchUserCarEmissions();
      } else {
        console.warn('Car data not available after waiting');
      }
    },
    components: {
      MyCarCard
    },
  data() {
    return {
      userCar: null,
      scrollIndex: 0,
      canScrollLeft: false,
      canScrollRight: true,
      cars: [
        { 
          name: "Tesla Model 3", 
          baseEmissions: 0,
          manufacturingEmissions: 10000,
          image: '/src/assets/tesla-model3.jpg'
        },
        { 
          name: "Toyota Corolla Hybrid", 
          baseEmissions: 95,
          manufacturingEmissions: 6500,
          image: '/src/assets/toyota-corolla.jpg'
        },
        { 
          name: "Nissan Leaf", 
          baseEmissions: 0,
          manufacturingEmissions: 8500,
          image: '/src/assets/nissan-leaf.jpg'
        },
        { 
          name: "Mazda 3", 
          baseEmissions: 139,
          manufacturingEmissions: 5000,
          image: '/src/assets/mazda-3.jpg'
        },
        { 
          name: "Hyundai Kona Electric", 
          baseEmissions: 0,
          manufacturingEmissions: 9000,
          image: '/src/assets/hyundai-kona.jpg'
        }
      ],
      top_cars: [
        { name: "Chery Omoda", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34169", emissions: 180 },
        { name: "MINI JCW Hatch", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=36874", emissions: 180 },
        { name: "Subaru Solterra", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33617", emissions: 180 }, // EV
        { name: "MINI JCW Aceman", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=35609", emissions: 185 },
        { name: "Mercedes-Benz EQB 250+", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33962", emissions: 0 }, // EV
        { name: "MINI Cooper", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=36650", emissions: 175 },
        { name: "Renault Megane", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33703", emissions: 160 },
        { name: "BMW X1", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33646", emissions: 150 },
        { name: "Volkswagen ID.5", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34360", emissions: 0 }, // EV
        { name: "Tesla Model 3", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=36859", emissions: 0 }, // EV
        { name: "Volkswagen ID.4", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34364", emissions: 0 }, // EV
        { name: "Mercedes-Benz EQE SUV", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=32441", emissions: 0 }, // EV
        { name: "Volvo EX30", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33704", emissions: 0 }, // EV
        { name: "Renault Kangoo", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33702", emissions: 120 },
        { name: "BMW 5 Series", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=33944", emissions: 140 },
        { name: "Volvo EX40", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34149", emissions: 0 }, // EV
        { name: "Ssangyong Torres", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34428", emissions: 200 },
        { name: "BMW X Series", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=36839", emissions: 155 },
        { name: "Mercedes-Benz EQS SUV", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=32459", emissions: 0 }, // EV
        { name: "Renault Trafic", link: "https://www.greenvehicleguide.gov.au/Vehicle/ViewMatchingVariants?vehicleDisplayId=34399", emissions: 195 }
      ],
      publicKm: 0,
      cyclingKm: 0,
      publicSavings: null,
      cyclingSavings: null,
      userCarEmissions: null,
      savingsFactors: {
        public: 0.15,   // 0.15 kg CO₂ saved per km by using public transport
        cycling: 0.20   // 0.20 kg CO₂ saved per km by cycling instead of driving
      },
    };
  },
  computed: {
    isComparisonReady() {
      return this.userCar && this.userCarEmissions !== null;
    }
  },
  methods: {
    scrollLeft() {
      const container = this.$refs.carScroll;
      const cardWidth = container.querySelector(".car-card").offsetWidth + 16;
      container.scrollBy({ left: -cardWidth, behavior: "smooth" });

      // Update scroll index safely
      this.scrollIndex = Math.max(this.scrollIndex - 1, 0);
      this.checkScrollPosition();
    },
    scrollRight() {
      const container = this.$refs.carScroll;
      const cardWidth = container.querySelector(".car-card").offsetWidth + 16;
      container.scrollBy({ left: cardWidth, behavior: "smooth" });

      // Update scroll index safely
      this.scrollIndex = Math.min(this.scrollIndex + 1, this.cars.length - 3);
      this.checkScrollPosition();
    },
    checkScrollPosition() {
      const container = this.$refs.carScroll;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      this.canScrollLeft = container.scrollLeft > 0;
      this.canScrollRight = container.scrollLeft < maxScrollLeft - 5;
    },

    compareCustomCar() {
      alert("Open form to compare a custom car.");
    },
    
    calcSavings(type) {
      if (type === 'public') {
        this.publicSavings = this.publicKm * this.savingsFactors.public;
      }
      if (type === 'cycling') {
        this.cyclingSavings = this.cyclingKm * this.savingsFactors.cycling;
      }
    },

    async fetchUserCarEmissions() {
      console.log('fetchUserCarEmissions called');
      console.log('userCar:', this.userCar);
      
      if (!this.userCar || !this.userCar.make || !this.userCar.model) {
        console.warn('No car data available yet');
        return;
      }
      
      console.log('Fetching emissions for:', this.userCar.make, this.userCar.model);
      
      try {
        const url = `${API_BASE}/emissions/car/${encodeURIComponent(this.userCar.make)}/${encodeURIComponent(this.userCar.model)}`;
        console.log('Fetching from URL:', url);
        
        // Add timeout to the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        console.log('Emissions API full response:', JSON.stringify(data, null, 2));
        
        this.userCarEmissions = data.emissions || 
                              data.co2_per_km || 
                              data.data?.emissions || 
                              data.data?.co2_per_km || 
                              150;
        
        console.log('User car emissions set to:', this.userCarEmissions);
        
        // Force Vue to update
        this.$forceUpdate();
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out after 10 seconds');
        } else {
          console.error('Failed to fetch user car emissions:', error);
        }
        // Set fallback value
        this.userCarEmissions = 150;
        console.log('Using fallback emissions:', this.userCarEmissions);
      }
    },
    calculateComparison(comparisonCar) {
      if (!this.userCarEmissions || this.userCarEmissions === null) {
        return { loading: true };
      }
      
      const emissionsDiff = this.userCarEmissions - comparisonCar.baseEmissions; // g/km saved
      
      if (emissionsDiff <= 0) {
        return {
          savings: 0,
          distance: null,
          message: "Higher or equal emissions"
        };
      }
      
      // Convert: manufacturingEmissions (kg) / (emissionsDiff g/km / 1000) = km
      const distanceToNetPositive = (comparisonCar.manufacturingEmissions * 1000) / emissionsDiff;
      
      return {
        savings: emissionsDiff,
        distance: Math.round(distanceToNetPositive)
      };
    }
  }
  };
</script>

<style scoped>
  .comparison-page {
    padding: 1rem;
    text-align: center;
  }

  .title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  /* Change Car with arrows */
  .change-car {
    margin: 2rem 0;
    position: relative;
  }

  .car-scroll-container {
    display: flex;
    align-items: center;
    position: relative;
  }

  .car-scroll {
    display: flex;
    overflow-x: hidden;
    scroll-behavior: smooth;
    width: 100%;
  }

  .car-card {
    flex: 0 0 calc(33.333% - 1rem); /* Better calculation */
    max-width: calc(33.333% - 1rem);
    margin: 0.5rem;
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    text-align: center;
    min-height: 350px; /* Ensure consistent height */
  }

  .car-card p {
    margin: 8px 0;
    font-size: 0.95rem;
  }

  .car-card strong {
    color: #059669;
  }

  .transport-img {
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
    border-radius: 8px;
    overflow: hidden;
  }

  .transport-img img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* This crops the image to fit */
    /* OR use object-fit: contain; to show the full image with letterboxing */
  }

  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .scroll-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 1);
  }

  .scroll-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .scroll-btn.left {
    left: 10px;
  }

  .scroll-btn.right {
    right: 10px;
  }

  /* Switch options side by side */
  .switch-options {
    display: flex;
    justify-content: space-around;
    margin: 2rem 0;
    flex-wrap: wrap;
  }
  .switch-option {
    width: 45%;
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  /* Best Low Emission Cars */
  .chart {
    height: 120px;
    margin-top: 1rem;
  }

  .top-cars-table {
    margin: 2rem auto;
    max-width: 600px;
    text-align: center;
  }
  .warning {
    color: #dc2626;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .loading-emissions {
    color: #6b7280;
    font-style: italic;
    font-size: 0.9rem;
  }
  .car-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .car-name {
    font-size: 1.1rem;
    margin: 0.5rem 0;
    color: #333;
  }

  /* Add responsive design */
  @media (max-width: 768px) {
    .car-card {
      flex: 0 0 calc(50% - 1rem);
      max-width: calc(50% - 1rem);
    }
  }

  @media (max-width: 480px) {
    .car-card {
      flex: 0 0 calc(100% - 1rem);
      max-width: calc(100% - 1rem);
    }
  }
</style>
