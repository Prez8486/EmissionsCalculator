<template>
  <div class="ptv-timetable-container">
    <h2>🚉 PTV Timetable & Stop Map</h2>

    <!-- Stop Search -->
    <div class="search-section">
      <input v-model="searchQuery"
             @input="searchStops"
             placeholder="Search for a stop (e.g. Flinders Street)" />
      <ul v-if="suggestions.length" class="suggestions">
        <li v-for="stop in suggestions"
            :key="stop.stop_id"
            @click="selectStop(stop)">
          {{ stop.stop_name }} ({{ routeTypeLabel(stop.route_type) }})
        </li>
      </ul>
    </div>

    <!-- Map Section -->
    <div class="map-section" v-if="mapVisible">

      <div id="ptv-map" class="tracking-map" ref="mapContainer"></div>
    </div>

    <!-- Stop Details -->
    <div v-if="selectedStop" class="stop-info">
      <h3>{{ selectedStop.stop_name }}</h3>
      <small>{{ routeTypeLabel(selectedStop.route_type) }}</small>
      <button @click="fetchDepartures">🔄 Refresh</button>
    </div>

    <!-- Departures Table -->
    <div v-if="departures.length" class="departures">
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Departure (Local)</th>
            <th>Status</th>
            <th>Platform</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in departures" :key="d.run_id">
            <td>{{ routeNames[d.route_id] || `Route ${d.route_id}` }}</td>
            <td>{{ formatTime(d.scheduled_departure_utc) }}</td>
            <td><span :class="statusClass(d)">{{ getStatus(d) }}</span></td>
            <td>{{ d.platform_number || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
  import L from "leaflet";
  import { API_BASE } from "@/config/apiConfig";

  export default {
    data() {
      return {
        map: null,
        marker: null,
        userMarker: null,
        searchQuery: "",
        suggestions: [],
        selectedStop: null,
        mapVisible: false,
        departures: [],
        routeNames: {},
        error: null,
      };
    },
    async mounted() {
     
    },
    methods: {
      async initializeMap() {
        if (this.map) return;
        const mapEl = this.$refs.mapContainer;
        if (mapEl._leaflet_id) mapEl._leaflet_id = null;

        this.map = L.map(mapEl).setView([-37.8136, 144.9631], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
        }).addTo(this.map);
      },

      async showUserLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            const coords = [latitude, longitude];
            if (this.userMarker) this.userMarker.remove();
            this.userMarker = L.marker(coords, {
              icon: L.divIcon({
                className: "user-location-icon",
                html: "📍",
                iconSize: [20, 20],
              }),
            }).addTo(this.map);
            this.map.setView(coords, 13);
          },
          err => console.warn("GPS error:", err),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      },

      async searchStops() {
        if (this.searchQuery.length < 2) {
          this.suggestions = [];
          return;
        }
        try {
          const res = await fetch(
            `${API_BASE}/ptv/stops/search/${encodeURIComponent(this.searchQuery)}`
          );
          const data = await res.json();
          this.suggestions = data.slice(0,8);
        } catch (err) {
          this.error = "Error fetching stops: " + err.message;
        }
      },

      async selectStop(stop) {
        this.mapVisible = true;
        await this.$nextTick(); // Wait for DOM to update

        // Initialize the map if not already ready
        await this.initializeMap();
        this.showUserLocation();
        this.selectedStop = stop;
        this.suggestions = [];
        this.searchQuery = stop.stop_name;

        const res = await fetch(`${ API_BASE }/ptv/stops/${ stop.stop_id }/${ stop.route_type }`);
        const data = await res.json();
        const { stop_latitude, stop_longitude } = data;
        
       
        if (stop_latitude && stop_longitude) {
          this.addMarker([stop_latitude, stop_longitude], stop.stop_name);
          this.map.setView([stop_latitude, stop_longitude], 15);
        }

        this.fetchDepartures();
        


      },

      addMarker(coords, name) {
        if (this.marker) this.marker.remove();
        this.marker = L.marker(coords).addTo(this.map);
        this.marker.bindPopup(`<b>${name}</b>`).openPopup();
      },

      async fetchDepartures() {
        if (!this.selectedStop) return;
        try {
          const res = await fetch(
            `${API_BASE}/ptv/departures/${this.selectedStop.route_type}/${this.selectedStop.stop_id}`
          );
          const data = await res.json();
          this.departures = data.departures?.slice(0, 8) || [];
          this.fetchRouteNames();
        } catch (err) {
          this.error = "Error loading departures: " + err.message;
        }
      },

      async fetchRouteNames() {
        for (const d of this.departures) {
          if (!this.routeNames[d.route_id]) {
            const res = await fetch(`${API_BASE}/ptv/route/${d.route_id}`);
            const data = await res.json();
            this.routeNames[d.route_id] = data.route_name || `Route ${d.route_id}`;
          }
        }
      },

      formatTime(utc) {
        const date = new Date(utc);
        return date.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },

      getStatus(d) {
        if (d.estimated_departure_utc) {
          const diff =
            (new Date(d.estimated_departure_utc) -
              new Date(d.scheduled_departure_utc)) /
            60000;
          if (diff > 2) return `Delayed ${Math.round(diff)} min`;
          if (diff < -1) return "Early";
          return "On Time";
        }
        return "Scheduled";
      },

      statusClass(d) {
        const s = this.getStatus(d);
        if (s.includes("Delayed")) return "status delayed";
        if (s.includes("Early")) return "status early";
        if (s.includes("On Time")) return "status ontime";
        return "status scheduled";
      },

      routeTypeLabel(type) {
        const labels = ["Tram", "Train", "Bus", "V/Line", "Night Bus"];
        return labels[type] || "Unknown";
      },
    },
  };
</script>

<style scoped>
  .ptv-timetable-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .tracking-map {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    border: 2px solid #ddd;
  }

  .suggestions {
    list-style: none;
    margin: 0;
    padding: 0;
    background: white;
    border: 1px solid #ccc;
    position: absolute;
    z-index: 10;
    width: 100%;
    border-radius: 6px;
  }

    .suggestions li {
      padding: 8px;
      cursor: pointer;
    }

      .suggestions li:hover {
        background: #f5f5f5;
      }

  .status.ontime {
    color: #28a745;
  }

  .status.delayed {
    color: #dc3545;
  }

  .status.early {
    color: #007bff;
  }
</style>
