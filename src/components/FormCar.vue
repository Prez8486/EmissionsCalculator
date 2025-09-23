<!--<template>
  <div class="form-container">
    <h2>Car Emission Calculator</h2>
    <form @submit.prevent="calculateEmission">-->
<!-- Distance -->
<!--<label>Distance per Trip (km):</label>
<input v-model.number="km" type="number" min="0" />-->
<!-- Trips -->
<!--<label>Trips per Week:</label>
<input v-model.number="trips" type="number" min="0" />-->
<!-- Extra Load -->
<!--<label>Extra Load:</label>
<select v-model="extraLoadType">
  <option value="none">None</option>
  <option value="caravan">Caravan</option>
  <option value="boat">Boat</option>
  <option value="trailer-light">Trailer (Light)</option>
  <option value="trailer-medium">Trailer (Medium)</option>
  <option value="trailer-heavy">Trailer (Heavy)</option>
</select>-->
<!-- Car Make -->
<!--<label>Car Make:</label>
<select v-model="selectedMake" @change="fetchModels">
  <option disabled value="">Select Make</option>
  <option v-for="make in makes || []" :key="make.make" :value="make.make">
    {{make.make }}
  </option>
</select>-->
<!-- Car Model -->
<!--<label>Car Model:</label>
<select v-model="selectedModel">
  <option disabled value="">Select Model</option>
  <option v-for="model in models || []" :key="model.model" :value="model.model">
    {{ model.model }}
  </option>
</select>-->
<!-- Calculate Button -->
<!--<button type="submit" :disabled="loading">
    {{ loading ? "Calculating..." : "Calculate" }}
  </button>
</form>-->
<!-- Result -->
<!--<div v-if="emissionPerTrip !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Per Trip:</strong> {{ emissionPerTrip.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Week:</strong> {{ emissionPerWeek.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Year:</strong> {{ emissionPerYear.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>-->
<!--<script>
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

          const res = await fetch("http://136.186.108.171/api/emissions/car/makes");
          const result = await res.json();
          this.makes = result.data || [];

        } catch (err) {
          console.error(err);
          alert("Failed to load car makes");
        }
      },
      async fetchModels() {
        try {

          const res = await fetch(`http://136.186.108.171/api/emissions/car/models/${this.selectedMake}`);
          const result = await res.json();
          this.models = result.data || [];


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
          const res = await fetch("http://136.186.108.171/api/emissions/car/emissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleMake: this.selectedMake,
              vehicleModel: this.selectedModel,
              distanceKm: this.km
            })
          });
          const data = await res.json();

          const emissionKg = data.data.co2e_kg;

          // Convert to tonnes & calculate totals
          this.emissionPerTrip = emissionKg / 1000;
          this.emissionPerWeek = this.emissionPerTrip * this.trips;
          this.emissionPerYear = this.emissionPerWeek * 52;
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
            vehicleMake: this.selectedMake,
            vehicleModel: this.selectedModel,
            distanceKm: this.km,
            trips: this.trips,
            extraLoad: this.extraLoadType
          };

          const res = await fetch("http://136.186.108.171/api/emissions/log", {
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
  body.dark label {
    color: #000000 !important;
  }
</style>-->
<template>
  <div class="form-container">
    <h2>Car Emission Calculator + Trip Tracker</h2>

    <!-- Live Trip Tracking Section -->
    <div id="map" class="map"></div>
    <div class="buttons">
      <button type="button" @click="startTrip" :disabled="tracking">Start Trip</button>
      <button type="button" @click="endTrip" :disabled="!tracking">End Trip</button>
    </div>

    <!-- Manual Car Form -->
    <form @submit.prevent="calculateEmission">
      <label>Distance per Trip (km):</label>
      <input v-model.number="km" type="number" min="0" readonly />

      <label>Trips per Week:</label>
      <input v-model.number="trips" type="number" min="0" />

      <label>Extra Load:</label>
      <select v-model="extraLoadType">
        <option value="none">None</option>
        <option value="caravan">Caravan</option>
        <option value="boat">Boat</option>
        <option value="trailer-light">Trailer (Light)</option>
        <option value="trailer-medium">Trailer (Medium)</option>
        <option value="trailer-heavy">Trailer (Heavy)</option>
      </select>

      <label>Car Make:</label>
      <select v-model="selectedMake" @change="fetchModels">
        <option disabled value="">Select Make</option>
        <option v-for="make in makes || []" :key="make.make" :value="make.make">
          {{ make.make }}
        </option>
      </select>

      <label>Car Model:</label>
      <select v-model="selectedModel">
        <option disabled value="">Select Model</option>
        <option v-for="model in models || []" :key="model.model" :value="model.model">
          {{ model.model }}
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
  import L from "leaflet";

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
        loading: false,

        // Leaflet tracking
        tracking: false,
        watchId: null,
        path: [],
        map: null,
        polyline: null
      };
    },
    async mounted() {
      localStorage.removeItem("carTripDistance");
      await this.fetchMakes();
      this.loadMap();
    },
    methods: {
      // === LIVE TRACKING ===
      startTrip() {
        this.path = [];
        this.km = 0;
        this.tracking = true;

        this.watchId = navigator.geolocation.watchPosition(
          this.trackPosition,
          err => alert("Location error: " + err.message),
          { enableHighAccuracy: true }
        );
      },
      endTrip() {
        this.tracking = false;
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);

        // Final distance calculation
        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr);
        }
        const kmValue = (total / 1000).toFixed(2);
        this.km = parseFloat(kmValue);
        localStorage.setItem("carTripDistance", kmValue);
        console.log(`Trip ended. Path has ${this.path.length} points.`, this.path);

      },
      trackPosition(pos) {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        this.path.push(latlng);

        if (this.map) {
          const leafletLatLng = L.latLng(latlng);
          L.marker(leafletLatLng).addTo(this.map);
          this.polyline.addLatLng(leafletLatLng);
          this.map.panTo(leafletLatLng);
        }

        // live update distance
        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr);
        }
        this.km = parseFloat((total / 1000).toFixed(2));
      },
      loadMap() {
        navigator.geolocation.getCurrentPosition(pos => {
          const center = [pos.coords.latitude, pos.coords.longitude];
          this.map = L.map("map").setView(center, 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
          }).addTo(this.map);
          this.polyline = L.polyline([], { color: "red" }).addTo(this.map);
        });
      },

      // === API CALLS ===
      async fetchMakes() {
        try {
          const res = await fetch("http://136.186.108.171/api/emissions/car/makes");
          const result = await res.json();
          this.makes = result.data || [];
        } catch (err) {
          console.error(err);
          alert("Failed to load car makes");
        }
      },
      async fetchModels() {
        try {
          const res = await fetch(`http://136.186.108.171/api/emissions/car/models/${this.selectedMake}`);
          const result = await res.json();
          this.models = result.data || [];
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
          const res = await fetch("http://136.186.108.171/api/emissions/car/emissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleMake: this.selectedMake,
              vehicleModel: this.selectedModel,
              distanceKm: this.km
            })
          });
          const data = await res.json();
          const emissionKg = data.data.co2e_kg;

          this.emissionPerTrip = emissionKg / 1000;
          this.emissionPerWeek = this.emissionPerTrip * this.trips;
          this.emissionPerYear = this.emissionPerWeek * 52;
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

        console.log(`Saving trip. Path has ${this.path.length} points.`, this.path);

        try {
          const payload = {
            transportMode: "car",
            vehicleMake: this.selectedMake,
            vehicleModel: this.selectedModel,
            distanceKm: this.km,
            trips: this.trips,
            extraLoad: this.extraLoadType,
            emissionKg: this.emissionPerTrip * 1000,
            path: this.path,
          };

          const res = await fetch("http://localhost:5000/api/emissions/log", {
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
    max-width: 600px;
    margin: auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 10px;
  }

  .map {
    height: 300px;
    width: 100%;
    margin-bottom: 1rem;
    border-radius: 8px;
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
    margin-top: 1rem;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
  }

  button:hover {
    background-color: #0056b3;
  }

  button:disabled {
    background: #a6d1ff;
    cursor: not-allowed;
  }

  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e6f5ff;
    border: 1px solid #007acc;
    border-radius: 8px;
    color: #00457c;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  body.dark label {
    color: #000000 !important;
  }
</style>
