<template>
  <div class="calculator-container">
    <h2>Transport Emissions Calculator</h2>

    <form @submit.prevent="calculateFootprint">
      <!-- Car Travel -->
      <label>Weekly Car Travel (km):</label>
      <input v-model.number="carKm" type="number" placeholder="e.g. 100" />

      <label>Car Brand:</label>
      <select v-model="carBrand">
        <option value="toyota">Toyota (0.18 kg CO₂/km)</option>
        <option value="honda">Honda (0.20 kg CO₂/km)</option>
        <option value="tesla">Tesla (0.0 kg CO₂/km)</option>
        <option value="ford">Ford (0.22 kg CO₂/km)</option>
      </select>

      <!-- Other Transport Modes -->
      <label>Weekly Bus Travel (km):</label>
      <input v-model.number="busKm" type="number" placeholder="e.g. 20" />

      <label>Weekly Tram Travel (km):</label>
      <input v-model.number="tramKm" type="number" placeholder="e.g. 10" />

      <label>Weekly Metro/Subway Travel (km):</label>
      <input v-model.number="metroKm" type="number" placeholder="e.g. 15" />

      <label>Flights per Year:</label>
      <input v-model.number="flights" type="number" placeholder="e.g. 2" />

      <button type="submit">Calculate</button>
    </form>

    <div v-if="totalEmissions !== null" class="result">
      <h3>Your Estimated Annual Transport Emissions:</h3>
      <p><strong>{{ totalEmissions.toFixed(2) }} tonnes CO₂</strong></p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'CarbonCalculator',
    data() {
      return {
        carKm: 0,
        carBrand: 'toyota',
        busKm: 0,
        tramKm: 0,
        metroKm: 0,
        flights: 0,
        totalEmissions: null
      }
    },
    methods: {
      calculateFootprint() {
        const carEmissionsPerKm = {
          toyota: 0.00018,
          honda: 0.00020,
          tesla: 0.00000,
          ford: 0.00022
        };

        const busFactor = 0.0001;
        const tramFactor = 0.00007;
        const metroFactor = 0.00006;
        const flightFactor = 0.5;

        const carEmissions = this.carKm * 52 * carEmissionsPerKm[this.carBrand];
        const busEmissions = this.busKm * 52 * busFactor;
        const tramEmissions = this.tramKm * 52 * tramFactor;
        const metroEmissions = this.metroKm * 52 * metroFactor;
        const flightEmissions = this.flights * flightFactor;

        this.totalEmissions = carEmissions + busEmissions + tramEmissions + metroEmissions + flightEmissions;
      }
    }
  }
</script>

<style scoped>
  .calculator-container {
    max-width: 600px;
    margin: auto;
    padding: 1.5em;
    background: #f9f9f9;
    border-radius: 10px;
    color: #333;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-top: 1em;
    font-weight: bold;
    color: #444;
  }

  input, select {
    padding: 0.5em;
    font-size: 1em;
    color: #222;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  button {
    margin-top: 1.5em;
    padding: 0.7em;
    font-size: 1em;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .result {
    margin-top: 2em;
    padding: 1em;
    background: #e0ffe0;
    border: 1px solid #00aa00;
    border-radius: 5px;
    color: #145214;
    font-weight: bold;
  }
</style>
