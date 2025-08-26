<template>
  <div class="form-container">
    <h2>Flight Emission Calculator</h2>
    <form>
      <label>From Airport:</label>
      <input v-model="FromKeyword" placeholder="Type city/code" @input="searchAirports('from')" />
      <select v-model="FromAirport">
        <option disabled value="">Select Airport</option>
        <option v-for="ap in FromAirports" :key="ap.code" :value="ap.code">
          {{ ap.airport_name }} ({{ ap.iata_code }})
        </option>
      </select>
      <label>To Airport:</label>
      <input v-model="ToKeyword" placeholder="Type city/code" @input="searchAirports('to')" />
      <select v-model="ToAirport">
        <option disabled value="">Select Airport</option>
        <option v-for="ap in ToAirports" :key="ap.code" :value="ap.code">
          {{ ap.airport_name }} ({{ ap.iata_code }})
        </option>
      </select>
      <label>Flight Class:</label>
      <select v-model="flightClass">
        <option value="economy">Economy</option>
        <option value="premium">Premium</option>
        <option value="business">Business</option>
        <option value="first">First</option>
      </select>

      <label>Number of Passengers:</label>
      <input v-model.number="passengers" type="number" min="0" />

      <label>
        <input type="checkbox" v-model="roundTrip" />
        Round Trip
      </label>
      <button type="submit" :disabled="loading">
        {{ loading ? "Calculating..." : "Calculate" }}
      </button>
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
        FromKeyword: '',
        ToKeyword: '',
        FromAirports: [],
        ToAirports: [],
        FromAirport: '',
        ToAirport: '',
        flights: 0,
        passengers: 1,
        roundTrip: false,
        loading: false,
        flightClass: 'economy',
        emission: null
      };
    },
   /* watch: {
      flights: 'calculateEmission',
      hours: 'calculateEmission',
      airline: 'calculateEmission',
      flightClass: 'calculateEmission'
    },*/
  methods: {
  /*async fetchFlightDetails() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("You must be logged in to save emissions.");
        this.$router.push('/login');
        return;
      }
      const res = await fetch('https://emissionscalculatorbackend.onrender.com/api/emissions/flightinfo', {
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
     
  
},*/
    async searchAirports(type) {
      try {
        const keyword = type === 'from' ? this.FromKeyword : this.ToKeyword;
        if (!keyword || keyword.length < 3) return; // wait until 3 chars
        const res = await fetch(`https://emissionscalculatorbackend.onrender.com/api/emissions/air/airports?keyword=${keyword}`);
        const result = await res.json();
        const airports = result.data || [];
        if (type === 'from') {
          this.FromAirports = airports || [];
        } else {
          this.ToAirports = airports || [];
        }
      }
      catch (err) {
        console.error("Airport search failed", err);
      }
    },

      async calculateEmission() {
        if (!this.FromAirport || !this.ToAirport) {
          alert("Please select both From and To airports");
          return;
        }
        try {
          this.loading = true;
          const res = await fetch("https://emissionscalculatorbackend.onrender.com/api/emissions/flight/emissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${ localStorage.getItem("token") }`
          },
        body: JSON.stringify({
          fromAirport: this.FromAirport,
          toAirport: this.ToAirport,
          passengers: this.passengers,
          flightClass: this.flightClass,
          roundTrip: this.roundTrip,
         /* includeWtt: this.includeWtt,
          addRf: this.addRf*/
        })
      });
      const data = await res.json();
      const emissionKg = data.data?.co2e_kg || 0;
      this.emission = emissionKg / 1000; // tonnes
      /*this.distance = data.data?.distance_km || null;*/
    } catch(err) {
      console.error("Emission calculation failed", err);
      alert("Error calculating flight emissions");
    } finally {
      this.loading = false;
    }
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

        fetch("https://emissionscalculatorbackend.onrender.com/api/emissions/log", {
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
 /* mounted() {
    this.calculateEmission();
  }*/
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
  body.dark label {
    color: #000000 !important;
  }
</style>
