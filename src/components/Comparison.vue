<template>
  <div class="comparison-page">
    <h1 class="title">Comparison Page</h1>

    <!-- Change Car Section -->
    <section class="change-car">
      <h2>Change Car</h2>
      <div class="car-scroll-container">
        <!-- Left Arrow -->
        <button class="scroll-btn left" @click="scrollLeft">◀</button>

        <!-- Scrollable Car Cards -->
        <div class="car-scroll" ref="carScroll">
          <div v-for="car in cars" :key="car.name" class="car-card">
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
        <button class="scroll-btn right" @click="scrollRight">▶</button>
      </div>
    </section>

    <!-- Switch transport options -->
    <section class="switch-options">
      <div class="switch-option">
        <h2>Switch to Public Transport</h2>
        <div class="placeholder-img">🚆</div>
        <p>
          Change a regular trip to public transport.  
          Enter trip data to see estimated savings.
        </p>
      </div>

      <div class="switch-option">
        <h2>Switch to Cycling</h2>
        <div class="placeholder-img">🚲</div>
        <p>
          Change a regular trip to cycling.  
          Enter trip data to see savings.  
        </p>
        <small>Maybe include info about safe cycling infrastructure.</small>
      </div>
    </section>

    <!-- Best Low Emission Cars -->
    <section class="best-low">
      <h2>Best Low Emission Cars</h2>
      <p>Show the lowest emission cars per km currently on the market.</p>
      <div class="placeholder-img chart">📊 Chart Placeholder</div>
    </section>
  </div>
</template>

<script>
export default {
  name: "ComparisonPage",
  data() {
    return {
      cars: [
        { name: "Electric Car", baseEmissions: 180, savings: 50, time: "3-4 years" },
        { name: "Hybrid Car", baseEmissions: 180, savings: 50, time: "3-4 years" },
        { name: "Used Small Car", baseEmissions: 0, savings: 30 },
        { name: "Luxury EV", baseEmissions: 200, savings: 60, time: "5 years" },
        { name: "Compact Gasoline", baseEmissions: 150, savings: 20 }
      ]
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
}
.car-scroll-container {
  display: flex;
  align-items: center;
  position: relative;
}
.car-scroll {
  display: flex;
  overflow-x: hidden; /* hide native scrollbar */
  gap: 1rem;
  padding: 1rem 0;
  scroll-behavior: smooth;
  flex: 1;
}
.car-card {
  min-width: 200px;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1rem;
  flex-shrink: 0;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.placeholder-img {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}
.custom-car {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0f7fa;
}
.custom-car button {
  padding: 0.5rem 1rem;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}
.scroll-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.scroll-btn:hover {
  background: #f0f0f0;
}
.scroll-btn.left {
  margin-right: 0.5rem;
}
.scroll-btn.right {
  margin-left: 0.5rem;
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
.best-low {
  margin: 2rem 0;
}
.chart {
  height: 120px;
  margin-top: 1rem;
}
</style>
