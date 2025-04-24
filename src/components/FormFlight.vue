<template>
  <div class="form-container">
    <h2>Flight Emission Calculator</h2>
    <form>
      <label>Airline Company:</label>
      <select v-model="airline">
        <option value="generic">Generic (0.09 t/h)</option>
        <option value="emirates">Emirates (0.10 t/h)</option>
        <option value="airindia">Air India (0.11 t/h)</option>
        <option value="qantas">Qantas (0.095 t/h)</option>
        <option value="ryanair">Ryanair (0.085 t/h)</option>
      </select>

      <label>Flight Class:</label>
      <select v-model="flightClass">
        <option value="economy">Economy</option>
        <option value="business">Business</option>
        <option value="first">First</option>
      </select>

      <label>Number of Flights:</label>
      <input v-model.number="flights" type="number" min="0" />

      <label>Average Hours per Flight:</label>
      <input v-model.number="hours" type="number" min="0" step="0.1" />
    </form>

    <div v-if="emission !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Total:</strong> {{ emission.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>export default {
    data() {
      return {
        flights: 0,
        hours: 1,
        airline: 'generic',
        flightClass: 'economy',
        emission: null
      };
    },
    watch: {
      flights: 'calculateEmission',
      hours: 'calculateEmission',
      airline: 'calculateEmission',
      flightClass: 'calculateEmission'
    },
    methods: {
      calculateEmission() {
        const airlineFactors = {
          generic: 0.09,
          emirates: 0.10,
          airindia: 0.11,
          qantas: 0.095,
          ryanair: 0.085
        };
        const classMultipliers = {
          economy: 1,
          business: 1.5,
          first: 2
        };
        const emissionPerHour = airlineFactors[this.airline] || 0.09;
        const multiplier = classMultipliers[this.flightClass] || 1;
        this.emission = this.flights * this.hours * emissionPerHour * multiplier;
      },
      save() {
        const record = {
          mode: 'Flight',
          flights: this.flights,
          hoursPerFlight: this.hours,
          airline: this.airline,
          flightClass: this.flightClass,
          emission: this.emission.toFixed(3),
          timestamp: new Date().toISOString()
        };
        const records = JSON.parse(localStorage.getItem('emissionsRecords')) || [];
        records.push(record);
        localStorage.setItem('emissionsRecords', JSON.stringify(records));
        alert("Flight trip saved!");
        this.$router.push('/');
      }
    },
    mounted() {
      this.calculateEmission();
    }
  };</script>

<style scoped>
  .form-container {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 10px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-top: 1rem;
  }

  input, select {
    padding: 0.5rem;
    margin-top: 0.3rem;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e6f5ff;
    border: 1px solid #007acc;
    border-radius: 8px;
    color: #00457c;
  }
</style>
