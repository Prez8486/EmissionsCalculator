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
  import { Motion } from "@capacitor/motion";
  import { Geolocation } from "@capacitor/geolocation";

  export default {
    data() {
      return {
        km: 0,
        emission: null,
        tracking: false,
        watchId: null,
        path: [],
        map: null,
        polyline: null,

        //For sensor batching
        sensorBuffer: [],
        batchSize: 600,        // 600 samples = 1 minute at 10Hz
        sampleInterval: null,  // setInterval handle
        tripId: "trip123",     // placeholder
        userId: "user123",
        tripStartTime: null,
        transportMode: this.$route.query.mode
      };
    },
    methods: {
      async startTrip() {
        try {
          this.tripStartTime = Date.now();
          const token = localStorage.getItem("token");
          const response = await fetch("http://10.0.2.2:5000/api/trips/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ transportMode: "car" })
          });

        const data = await response.json();
        this.tripId = data.tripId; // Use dynamic tripId instead of "trip123"
        console.log("Trip started with ID:", this.tripId, this.transportMode);

        this.path = [];
        this.km = 0;
        this.tracking = true;

        this.watchId = navigator.geolocation.watchPosition(
          this.trackPosition,
          (err) => alert("Location error: " + err.message),
          { enableHighAccuracy: true }
        );

        // Start sensor logging every 10hz (100ms)
        this.logInterval = setInterval(this.captureAndBufferSensorData, 100);
      } catch (error) {
        console.error("Failed to start trip:", error);
        alert("Could not start trip");
        return;
      }
    },

      async endTrip() {
        try {
          this.tracking = false;

          if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
          if (this.logInterval) clearInterval(this.logInterval);

          // Flush remaining buffer if not empty
          if (this.sensorBuffer.length > 0) {
            await this.sendBatch(true);
          }

          // Calculate distance and duration
          let total = 0;
          for (let i = 1; i < this.path.length; i++) {
            const prev = L.latLng(this.path[i - 1]);
            const curr = L.latLng(this.path[i]);
            total += prev.distanceTo(curr); // meters
          }

          const distanceKm = (total / 1000);
          const durationSeconds = Math.floor((Date.now() - this.tripStartTime) / 1000); // You'll need to track start time

          // Call backend to end trip
          const token = localStorage.getItem("token");
          const response = await fetch("http://localhost:3000/api/trips/end", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              tripId: this.tripId,
              distanceKm: distanceKm,
              durationSeconds: durationSeconds
            })
          });

          const data = await response.json();
          console.log("Trip ended:", data);

          // Store for form if needed
          localStorage.setItem("lastTripDistance", distanceKm.toFixed(2));

          // Redirect to appropriate form or home
          this.$router.push("/home"); //want to go after trip ends

        } catch (error) {
          console.error("Failed to end trip:", error);
          alert("Error ending trip");
        }
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

    async captureAndSendSensorData(){
        let accel = {};
        let gyro = {};
        let gps = {};

        try{
          const motion = await Motion.getCurrentAcceleration();
          accel = {x: motion.x, y: motion.y, z: motion.z};
          console.log("Accelerometer data:", accel);
        }catch(error){
          accel = { x: null, y: null, z: null };
          console.log("Accelerometer error:", error);
        }
        try {
        const rotation = await Motion.getCurrentOrientation();
        gyro = { alpha: rotation.alpha, beta: rotation.beta, gamma: rotation.gamma };
        console.log("Gyroscope data:", gyro);
        } catch(error) {
        gyro = { alpha: null, beta: null, gamma: null };
        console.log("Gyroscope error:", error);
      }
        try {
          const pos = await Geolocation.getCurrentPosition();
          gps = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude
          };
          console.log("✅ GPS data:", gps);
        } catch {
          gps = {};
        }

        //build one reading
        const packet = {
        timestamp: new Date().toISOString(),
        accelerometer: accel,
        gyroscope: gyro,
        gps: gps
      };

      // Add to buffer
      this.sensorBuffer.push(packet);
      console.log(`📊 Buffer size: ${this.sensorBuffer.length}/600`);

      console.log("Sensor Packet:", packet);
          // Check buffer size
      if (this.sensorBuffer.length >= this.batchSize) {
        await this.sendBatch(false);
      }
    },

    async sendBatch(forceSend = false) {
      if (!this.sensorBuffer.length && !forceSend) return;
      console.log(`📤 Sending batch of ${this.sensorBuffer.length} samples...`);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://10.0.2.2:5000/api/ai/predict", { // Fixed endpoint
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` // Add auth header
          },
          body: JSON.stringify({
            sensorDataArray: this.sensorBuffer, // Match expected format
            tripId: this.tripId,
            userId: this.userId // You might not need this as it comes from token
          })
        });

        const result = await response.json();
        console.log("✅ Batch sent successfully, prediction:", result);

        // Handle the prediction response
        if (result.success && result.prediction) {
          console.log(`🎯 Predicted mode: ${result.prediction.mode} (${result.prediction.confidence})`);
          // You can store this prediction or show it to user
          this.lastPrediction = result.prediction;
      }
    } catch (error) {
      console.error("❌ Failed to send batch:", error);
    }
    // Reset buffer
    this.sensorBuffer = [];
  }
},
    async save() {
      const token = localStorage.getItem("token");
      if (!token) return this.$router.push("/login");

      const payload = {
        transportMode: "car",
        distanceKm: this.km,
      };

        await fetch("https://emissionscalculatorbackend.duckdns.org/api/emissions/log", {
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
      navigator.geolocation.getCurrentPosition((pos) => {
        const center = [pos.coords.latitude, pos.coords.longitude];
        this.map = L.map("map").setView(center, 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
        }).addTo(this.map);

        this.polyline = L.polyline([], { color: "red" }).addTo(this.map);
      });
    },
  mounted() {
    this.loadMap();
  },
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

button:disabled {
  background: rgba(0, 123, 255, 0.55);
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
