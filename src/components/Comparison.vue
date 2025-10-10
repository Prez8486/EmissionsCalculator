<template>
  <div class="comparison-page">
    <h1 class="title">Comparison Page</h1>

    <CarSelector />

    <!-- Change Car Section -->
    <section class="change-car">
      <h2>Change Car</h2>
      <div class="car-scroll-container">
        <!-- Left Arrow -->
        <button 
          class="scroll-btn left" 
          @click="scrollLeft" 
          :disabled="scrollIndex === 0">
          ‹
        </button>

        <!-- Scrollable Car Cards -->
        <div class="car-scroll" ref="carScroll">
                    <div
              v-for="(car, index) in cars"
              :key="car.name"
              class="car-card"
            >
          
            <div class="placeholder-img">{{ car.name }}</div>
            <p>Base Emissions: {{ car.baseEmissions }}</p>
            <p v-if="car.savings">Estimated savings: {{ car.savings }}</p>
            <p v-if="car.time">Time until net positive: {{ car.time }}</p>
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
          :disabled="scrollIndex >= cars.length - 3">
          ›
        </button>
      </div>
    </section>

    <!-- Switch transport options -->
    <section class="switch-options">
      <!-- Public Transport -->
      <div class="switch-option">
        <h2>Switch to Public Transport</h2>
        <div class="placeholder-img">🚆</div>
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
        <div class="placeholder-img">🚲</div>
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

<script>
import CarSelector from '@/components/CarSelector.vue'

export default {
  components: { CarSelector },
  name: "ComparisonPage",
  data() {
    return {
      cars: [
        { name: "Electric Car", baseEmissions: 180, savings: 50, time: "3-4 years" },
        { name: "Hybrid Car", baseEmissions: 180, savings: 50, time: "3-4 years" },
        { name: "Used Small Car", baseEmissions: 0, savings: 30 },
        { name: "Luxury EV", baseEmissions: 200, savings: 60, time: "5 years" },
        { name: "Compact Gasoline", baseEmissions: 150, savings: 20 }
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
        savingsFactors: {
      public: 0.15,   // 0.15 kg CO₂ saved per km by using public transport
      cycling: 0.20   // 0.20 kg CO₂ saved per km by cycling instead of driving
    }
    };
  },
  methods: {
    scrollLeft() {
      const container = this.$refs.carScroll;
      const cardWidth = container.querySelector(".car-card").offsetWidth + 16; // tile + gap
      container.scrollBy({ left: -cardWidth, behavior: "smooth" });
    },
    scrollRight() {
      const container = this.$refs.carScroll;
      const cardWidth = container.querySelector(".car-card").offsetWidth + 16;
      container.scrollBy({ left: cardWidth, behavior: "smooth" });
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
  flex: 0 0 calc(100% / 3); /* Exactly 3 fit on screen */
  max-width: calc(100% / 3);
  margin: 0.5rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  text-align: center;
}

.placeholder-img {
  height: 150px;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-bottom: 0.5rem;
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
</style>
