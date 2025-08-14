<template>
  <div class="form-container">
    <h2>Car Trip Tracker (Leaflet)</h2>

    <div id="map" class="map"></div>

    <form @submit.prevent="save">
      <label>Distance (km):</label>
      <input v-model.number="km" type="number" readonly />

      <div class="buttons">
        <button type="button" @click="startTrip" :disabled="tracking">Start Trip</button>
        <button type="button" @click="endTrip" :disabled="!tracking">End Trip</button>
      </div>

      
    </form>
  </div>
</template>

<script>
  import L from "leaflet";

  export default {
    data() {
      return {
        km: 0,
        emission: null,
        tracking: false,
        watchId: null,
        path: [],
        map: null,
        polyline: null
      };
    },
    methods: {
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

        // Calculate and store distance
        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr); // meters
        }

        const kmValue = (total / 1000).toFixed(2);
        localStorage.setItem('carTripDistance', kmValue); // Save to localStorage

        // Redirect to car form
        this.$router.push('/form/car');
      }
      ,
      trackPosition(pos) {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        this.path.push(latlng);

        if (this.map) {
          const leafletLatLng = L.latLng(latlng);
          L.marker(leafletLatLng).addTo(this.map);
          this.polyline.addLatLng(leafletLatLng);
          this.map.panTo(leafletLatLng);
        }

        // Live update km and emission
        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr); // meters
        }
        this.km = parseFloat((total / 1000).toFixed(2)); // live update
        this.calculateEmission();
      },
      calculateDistance() {
        let total = 0;
        for (let i = 1; i < this.path.length; i++) {
          const prev = L.latLng(this.path[i - 1]);
          const curr = L.latLng(this.path[i]);
          total += prev.distanceTo(curr); // meters
        }
        this.km = (total / 1000).toFixed(2);
        this.calculateEmission();
      },
      calculateEmission() {
        const fuelEfficiency = 7.5;
        const emissionFactor = 2.31;
        const emissionKg = (fuelEfficiency / 100) * this.km * emissionFactor;
        this.emission = emissionKg / 1000;
      },
      async save() {
        const token = localStorage.getItem("token");
        if (!token) return this.$router.push("/login");

        const payload = {
          transportMode: "car",
          distanceKm: this.km
        };

        await fetch("https://emissionscalculatorbackend-2.onrender.com/api/emissions/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ token }`
          },
      body: JSON.stringify(payload)
    });

    this.$router.push("/home");
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
  }
    },
  mounted() {
    this.loadMap();
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

  input {
    padding: 0.5rem;
    margin: 0.5rem 0;
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
    margin-top: 1rem;
    background: #e6f5ff;
    padding: 1rem;
    border-radius: 6px;
  }

  .buttons {
    display: flex;
    gap: 1rem;
  }
</style>
