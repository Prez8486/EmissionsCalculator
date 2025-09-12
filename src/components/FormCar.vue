<template>
  <div class="form-container">
    <h2>Car Emission Calculator</h2>
    <form @submit.prevent="calculateEmission">
      <!-- Distance -->
      <label>Distance of Trip (km):</label>
      <input v-model.number="km" type="number" min="0" />

      <!-- Trips -->
      <label>Trips per Week:</label>
      <input v-model.number="trips" type="number" min="0" />

      <!-- Extra Load -->
      <label>Extra Load:</label>
      <select v-model="extraLoadType">
        <option value="none">None</option>
        <option value="caravan">Caravan</option>
        <option value="boat">Boat</option>
        <option value="trailer-light">Trailer (Light)</option>
        <option value="trailer-medium">Trailer (Medium)</option>
        <option value="trailer-heavy">Trailer (Heavy)</option>
      </select>

      <!-- Car Make -->
      <label>Car Make:</label>
      <select v-model="selectedMake" @change="fetchModels">
        <option disabled value="">Select Make</option>
        <option v-for="make in makes || []" :key="make.id" :value="make.id">
          {{ make.data.attributes.name }}
        </option>
      </select>

      <!-- Car Model -->
      <label>Car Model:</label>
      <select v-model="selectedModel">
        <option disabled value="">Select Model</option>
        <option v-for="model in models || []" :key="model.id" :value="model.id">
          {{ model.attributes.name }}
        </option>
      </select>

      <!-- Calculate Button -->
      <button type="submit" :disabled="loading">
        {{ loading ? "Calculating..." : "Calculate" }}
      </button>
    </form>

    <!-- Result -->
    <div v-if="emissionPerTrip !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Per Trip:</strong> {{ emissionPerTrip.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Week:</strong> {{ emissionPerWeek.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Year:</strong> {{ emissionPerYear.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        km: parseFloat(localStorage.getItem("carTripDistance")) || 0,
        trips: 1,
        extraLoadType: "none",
        makes: [],
        models: [],
        selectedMake: "",
        selectedModel: "",
        emissionPerTrip: null,
        emissionPerWeek: null,
        emissionPerYear: null,
        loading: false
      };
    },
    async mounted() {
      localStorage.removeItem("carTripDistance");
      await this.fetchMakes();
    },
    methods: {
      async fetchMakes() {
        try {
          const res = await fetch("https://emissionscalculatorbackend-2.onrender.com/api/emissions/car/makes");
          this.makes = await res.json();
        } catch (err) {
          console.error(err);
          alert("Failed to load car makes");
        }
      },
      async fetchModels() {
        try {
          const res = await fetch(`https://emissionscalculatorbackend-2.onrender.com/api/emissions/car/models/${this.selectedMake}`);
          this.models = await res.json();
        } catch (err) {
          console.error(err);
          alert("Failed to load car models");
        }
      },
      async calculateEmission() {
        if (!this.selectedModel || !this.km) {
          alert("Please enter distance and select a model");
          return;
        }
        try {
          this.loading = true;
          const res = await fetch("https://emissionscalculatorbackend-2.onrender.com/api/emissions/car/emissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleModelId: this.selectedModel,
              distanceKm: this.km,
              trips: this.trips,
              extraLoadType: this.extraLoadType
            })
          });
          //recieving calculated response from backend
          const data = await res.json();

          this.emissionPerTrip = data.emissionPerTrip;
          this.emissionPerWeek = data.emissionPerWeek;
          this.emissionPerYear = data.emissionPerYear;
        } catch (err) {
          console.error(err);
          alert("Error calculating emissions");
        } finally {
          this.loading = false;
        }
      },
      async save() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to save emissions.");
          this.$router.push("/login");
          return;
        }

        try {
          const payload = {
            transportMode: "car",
            vehicleModelId: this.selectedModel,
            distanceKm: this.km,
            trips: this.trips,
            extraLoad: this.extraLoadType
          };

          const res = await fetch("https://emissionscalculatorbackend-2.onrender.com/api/emissions/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.message) {
            alert("Trip saved to backend!");
            this.$router.push("/home");
          } else {
            alert("Failed to save: " + data.error);
          }
        } catch (err) {
          console.error(err);
          alert("Error saving emission log.");
        }
      }
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

  input,
  select {
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
