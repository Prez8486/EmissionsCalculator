<template>
  <div class="form-container">
    <h2>Car Emission Calculator + Trip Tracker</h2>

    <!-- Toggle -->
    <div class="toggle-container">
      <label class="switch">
        <input type="checkbox" v-model="pickDropMode" />
        <span class="slider"></span>
      </label>
      <span>{{ pickDropMode ? "Pick & Drop Mode" : "Live GPS Tracking" }}</span>
    </div>

    <!-- Map -->
    <div id="map" class="map"></div>

    <!-- GPS Buttons -->
    <div v-if="!pickDropMode" class="buttons">
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
        polyline: null,

        // Toggle
        pickDropMode: false,
        clickMarkers: []
      };
    },
    async mounted() {
      localStorage.removeItem("carTripDistance");
      await this.fetchMakes();
      this.loadMap();
    },
    methods: {
      // === TOGGLE PICK & DROP ===
      enablePickDrop() {
        if (!this.map) return;
        this.map.on("click", this.handleMapClick);
      },
      disablePickDrop() {
        if (!this.map) return;
        this.map.off("click", this.handleMapClick);
        this.clearClickMarkers();
      },
      handleMapClick(e) {
        if (this.clickMarkers.length >= 2) {
          this.clearClickMarkers();
        }
        const marker = L.marker(e.latlng).addTo(this.map);
        this.clickMarkers.push(marker);

        if (this.clickMarkers.length === 2) {
          const start = this.clickMarkers[0].getLatLng();
          const end = this.clickMarkers[1].getLatLng();
          const distance = start.distanceTo(end) / 1000;
          this.km = parseFloat(distance.toFixed(2));
          this.polyline.setLatLngs([start, end]);
        }
      },
      clearClickMarkers() {
        this.clickMarkers.forEach(m => this.map.removeLayer(m));
        this.clickMarkers = [];
        this.polyline.setLatLngs([]);
        this.km = 0;
      },

      // === GPS LIVE TRACKING ===
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

        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr);
        }
        const kmValue = (total / 1000).toFixed(2);
        this.km = parseFloat(kmValue);
        localStorage.setItem("carTripDistance", kmValue);
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

        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr);
        }
        this.km = parseFloat((total / 1000).toFixed(2));
      },

      // === MAP INIT ===
      loadMap() {
        navigator.geolocation.getCurrentPosition(pos => {
          const center = [pos.coords.latitude, pos.coords.longitude];
          this.map = L.map("map").setView(center, 15);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
          }).addTo(this.map);
          this.polyline = L.polyline([], { color: "red" }).addTo(this.map);

          // React to toggle
          this.$watch("pickDropMode", val => {
            if (val) this.enablePickDrop();
            else this.disablePickDrop();
          });
        });
      },

      // === API ===
      async fetchMakes() {
        try {
          const res = await fetch("https://emissionscalculatorbackend.duckdns.org/api/emissions/car/makes");
          const result = await res.json();
          this.makes = result.data || [];
        } catch (err) {
          console.error(err);
          alert("Failed to load car makes");
        }
      },
      async fetchModels() {
        try {
          const res = await fetch(`https://emissionscalculatorbackend.duckdns.org/api/emissions/car/models/${this.selectedMake}`);
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
          const res = await fetch("https://emissionscalculatorbackend.duckdns.org/api/emissions/car/emissions", {
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

        try {
          const payload = {
            transportMode: "car",
            vehicleMake: this.selectedMake,
            vehicleModel: this.selectedModel,
            distanceKm: this.km,
            trips: this.trips,
            extraLoad: this.extraLoadType,
            emissionKg: this.emissionPerTrip * 1000
          };

          const res = await fetch("https://emissionscalculatorbackend.duckdns.org/api/emissions/log", {
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

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 24px;
  }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 24px;
    transition: 0.4s;
  }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.4s;
    }

  input:checked + .slider {
    background-color: #007bff;
  }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

  body.dark label switch span {
    color: #000 !important;
  }
</style>
