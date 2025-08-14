<template>
  <div class="form-container">
    <h2>Flight Emission Calculator</h2>
    <form>
      <label>Flight Code:</label>
      <input v-model="flightCode" placeholder="e.g., EK123" />

      <label>Flight Date:</label>
      <input type="date" v-model="flightDate" />

      <button type="button" @click="fetchFlightDetails">Fetch Flight Info</button>
      <label>Airline Company:</label>
      <input v-model="airline" placeholder="e.g., Emirates" />

      <label>Flight Class:</label>
      <select v-model="flightClass">
        <option value="economy">Economy</option>
        <option value="business">Business</option>
        <option value="first">First</option>
      </select>

      <label>Number of Flights:</label>
      <input v-model.number="flights" type="number" min="0" />

      <label>Average Hours per Flight:</label>
      <input v-model.number="hours" type="number" min="0" step="0.1" readonly />
    </form>

    <div v-if="emission !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Total:</strong> {{ emission.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        flightCode: '',
        flightDate: '',
        flights: 0,
        hours: 1,
        airline: '',
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
  async fetchFlightDetails() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("You must be logged in to save emissions.");
        this.$router.push('/login');
        return;
      }
      const res = await fetch('https://emissionscalculatorbackend-3.onrender.com/api/emissions/flightinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          flightCode: this.flightCode,
          flightDate: this.flightDate
        })
      });
      const data = await res.json();
      this.hoursPerFlight = data.durationHours;
      this.airline = data.airline;
    } catch (err) {
      alert('Flight info fetch failed.');
      console.error(err);
    }
     
  
},
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
        const airlineKey = (this.airline || 'generic').toLowerCase();
        const emissionPerHour = airlineFactors[airlineKey] || airlineFactors['generic'];
        const multiplier = classMultipliers[this.flightClass] || 1;
        this.emission = this.flights * this.hours * emissionPerHour * multiplier;
      },
      save() {
        const token = localStorage.getItem('token');
        if (!token) {
          alert("You must be logged in to save emissions.");
          this.$router.push('/login');
          return;
        }

        const payload = {
          transportMode: 'flight',
          distanceKm: this.flights * this.hours * 900, // Approx flight distance
          emissionKg: this.emission * 1000, // Convert tonnes to kg
          flights: this.flights,
          hoursPerFlight: this.hours,
          airline: this.airline,
          flightClass: this.flightClass,
          date: new Date().toISOString()
        };

        fetch("https://emissionscalculatorbackend-3.onrender.com/api/emissions/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ token }`
    },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
      .then(data => {
        if (data.message) {
          alert("Flight trip saved to backend!");
          this.$router.push('/home');
        } else {
          alert("Failed to save: " + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error saving emission log.");
      });
  }
    },
  mounted() {
    this.calculateEmission();
  }
  };
</script>

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
