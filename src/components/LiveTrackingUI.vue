<template>
  <div class="live-tracking-container">
    <!-- Map Display -->
    <div class="map-section">
      <div id="tracking-map" class="tracking-map" ref="mapContainer"></div>

      <!-- Destination Search Bar -->
      <DestinationSearchBar
        v-if="!isActive"
        :current-location="userLocation"
        @destination-selected="handleDestinationSelected"
        @destination-cleared="handleDestinationCleared"
      />
      <!-- Route Overlay on Map -->
      <RouteOverlay
        v-if="map && calculatedRoutes"
        :map="map"
        :fastest-route="calculatedRoutes.fastest"
        :greenest-route="calculatedRoutes.greenest"
        :selected-route="selectedRouteType"
        :show-greenest="calculatedRoutes.show_alternative"
        @route-clicked="handleRouteClicked"
      />

      <!-- Map Overlay Info -->
      <div class="map-overlay">
        <div class="distance-display">
          <span class="distance-label">Distance:</span>
          <span class="distance-value">{{ formatDistance(distance) }} km</span>
        </div>
        <div v-if="isActive" class="tracking-status">
          <div class="pulse-indicator"></div>
          Live Tracking Active
        </div>
      </div>
    </div>

    <!-- Transport Mode Selector -->
    <TransportModeSelector
      v-if="showRouteSelection"
      v-model="enabledModes"
    />
    <!-- Route Comparison Card -->
    <RouteComparisonCard
      v-if="showRouteSelection"
      :fastest="calculatedRoutes.fastest"
      :greenest="calculatedRoutes.greenest"
      :show-greenest="calculatedRoutes.show_alternative"
      :selected="selectedRouteType"
      @route-selected="handleRouteSelected"
    />

    <!-- Control Buttons -->
    <div class="controls-section">
      <button @click="handleStartTrip"
              :disabled="isActive || loading"
              class="control-button start-button"
              :class="{ 'active': isActive }">
        <span class="button-icon">📍</span>
        {{ isActive ? 'Trip Active' : 'Start Trip' }}
      </button>

      <button @click="handleEndTrip"
              :disabled="!isActive || loading"
              class="control-button end-button">
        <span class="button-icon">🏁</span>
        {{ loading ? 'Ending...' : 'End Trip' }}
      </button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="calculating" class="loading-overlay">
      <div class="spinner"></div>
      <p>Calculating routes...</p>
    </div>

    <!-- Trip Stats (when active) -->
    <div v-if="isActive" class="trip-stats">
      <div class="stat-item">
        <div class="stat-label">Duration</div>
        <div class="stat-value">{{ formatDuration(tripDuration) }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Speed</div>
        <div class="stat-value">{{ averageSpeed }} km/h</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Distance</div>
        <div class="stat-value">{{ formatDistance(distance) }} km</div>
      </div>
    </div>

    <!-- Additional Form Fields (Car specific) -->
    <!-- Car Info Card (fetched from backend) -->
    <div v-if="trip?.transportMode === 'car' && car && car.make" class="car-info-card">
      <h3>🚗 My Car</h3>
      <p><strong>Make:</strong> {{ car?.make || 'NA' }}</p>
      <p><strong>Model:</strong> {{ car?.model || 'NA' }}</p>
      <p><strong>Extra Load:</strong> {{ formatExtraLoad(car?.extraLoad) }}</p>
    </div>

    <!-- GPS Status Indicator -->
    <div class="gps-status" :class="gpsStatusClass">
      <span class="status-icon">{{ gpsStatusIcon }}</span>
      <span class="status-text">{{ gpsStatusText }}</span>
    </div>
  </div>
</template>

<script>
import { API_BASE } from '@/config/apiConfig';
import PlannedRoute from '@/models/PlannedRoute';
import DestinationSearchBar from '@/components/LiveTracking/DestinationSearchBar.vue';
import TransportModeSelector from '@/components/LiveTracking/TransportModeSelector.vue';
import RouteComparisonCard from '@/components/LiveTracking/RouteComparisonCard.vue';
import RouteOverlay from '@/components/LiveTracking/RouteOverlay.vue';
export default {
  name: 'LiveTrackingUI',

  components: {
    DestinationSearchBar,
    TransportModeSelector,
    RouteComparisonCard,
    RouteOverlay
  },

  props: {
    trip: {
      type: Object,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    distance: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      map: null,
      tripStartTime: null,
      tripDuration: 0,
      intervalId: null,
      gpsStatus: 'checking', // checking, available, unavailable, error
      car: {make: '', model: '', extraLoad: ''},

      //Route Planning State
      userLocation: null,           // { lat, lng }
      destination: null,            // { lat, lon, address }
      enabledModes: ['car', 'walk', 'train', 'tram', 'bus'], // Selected transport modes
      calculatedRoutes: null,       // PlannedRoute instance
      selectedRouteType: 'fastest', // 'fastest' or 'greenest'
      calculating: false,           // Loading state for route calculation
      recalcTimer: null            // Debounce timer
    };
  },

  computed: {
    hasAdditionalFields() {
      return this.trip && this.trip.transportMode === 'car';
    },

    averageSpeed() {
      if (!this.isActive || !this.distance || !this.tripDuration) {
        return '0.0';
      }
      const hours = this.tripDuration / (1000 * 60 * 60);
      if (hours === 0) return '0.0';

      const speed = this.distance / hours;
      return isNaN(speed) ? '0.0' : speed.toFixed(1);
    },

    gpsStatusClass() {
      return {
        'gps-available': this.gpsStatus === 'available',
        'gps-checking': this.gpsStatus === 'checking',
        'gps-unavailable': this.gpsStatus === 'unavailable',
        'gps-error': this.gpsStatus === 'error'
      };
    },

    gpsStatusIcon() {
      const icons = {
        checking: '🔍',
        available: '🟢',
        unavailable: '🔴',
        error: '⚠️'
      };
      return icons[this.gpsStatus] || '❓';
    },

    gpsStatusText() {
      const texts = {
        checking: 'Checking GPS...',
        available: 'GPS Ready',
        unavailable: 'GPS Unavailable',
        error: 'GPS Error'
      };
      return texts[this.gpsStatus] || 'Unknown';
    },

    showRouteSelection(){
      return this.destination && this.calculatedRoutes && !this.isActive;
    },

    startButtonTest(){
      if (this.isActive) return 'Trip Active';
      if (!this.selectedRouteType) return '🚀 Start Trip';
      const routeName = this.selectedRouteType === 'greenest' ? 'Greenest' : 'Fastest';
      return `🚀 Start with ${routeName} Route`;
    }

  },

  mounted() {
    this.loadUserCar();
    this.initLiveTracking();
  },

  beforeUnmount() {
    this.cleanup();
  },

  watch: {
    isActive(newVal) {
      if (newVal) {
        this.startDurationTimer();
      } else {
        this.stopDurationTimer();
      }
    },

    //Watch enabled modes for recalculation of routes
    enabledModes: {
      handler() {
        if (this.destination) {
          clearTimeout(this.recalcTimer);
          this.recalcTimer = setTimeout(() => {
            this.calculateRoutes();
          }, 500);
        }
      },
      deep: true
    }
  },

  methods: {
    async initLiveTracking() {
      if (!navigator.geolocation) {
        console.warn("❌ Geolocation not supported, loading fallback map...");
        this.gpsStatus = "unavailable";
        await this.trip.initializeMap(this.$refs.mapContainer, { zoom: 16 }, { lat: -37.8136, lng: 144.9631 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log("✅ GPS available, initializing map...");
          this.gpsStatus = "available";
          await this.trip.initializeMap(this.$refs.mapContainer, { zoom: 16 }, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        async (err) => {
          console.warn("⚠️ GPS access denied or unavailable:", err);
          this.gpsStatus = "unavailable";
          await this.trip.initializeMap(this.$refs.mapContainer, { zoom: 16 }, { lat: -37.8136, lng: 144.9631 });
          this.userLocation = { lat: -37.8136, lng: 144.9631 };
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },

    async initializeMap(lat, lng) {
      try {
        this.map = await this.trip.initializeMap(this.$refs.mapContainer, { zoom: 16 });
        this.map.setView([lat, lng], 14);
        this.userLocation = { lat, lng };
        console.log("🗺️ Map initialized successfully");
      } catch (error) {
        console.error("Failed to initialize map:", error);
        this.gpsStatus = "error";
      }
    },


    async loadUserCar() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_BASE}/auth/car`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to load car details')
        const data = await res.json()
        if (data.car) {
          this.car = data.car
          // Also sync trip data with car info for saving later
          this.trip.updateData({
            vehicleMake: this.car.make,
            vehicleModel: this.car.model,
            extraLoad: this.car.extraLoad
          })
        }
      } catch (err) {
        console.error('Error fetching car details:', err)
      }
    },
    formatExtraLoad(load) {
      const map = {
        none: 'None',
        caravan: 'Caravan',
        boat: 'Boat',
        'trailer-light': 'Trailer (Light)',
        'trailer-medium': 'Trailer (Medium)',
        'trailer-heavy': 'Trailer (Heavy)'
      }
      return map[load] || 'Unknown'
    },

    async handleStartTrip() {
      if (this.gpsStatus !== 'available') {
        alert('GPS is not available. Please enable location services.');
        return;
      }

      //Set route if planned
      if (this.destination && this.calculatedRoutes) {
        this.trip.setDestination(this.destination);
        this.trip.setPlannedRoute(this.calculatedRoutes, this.selectedRouteType);
      }

      this.tripStartTime = Date.now();
      this.$emit('start-trip');
    },

    handleEndTrip() {
      this.$emit('end-trip');
    },

    startDurationTimer() {
      this.intervalId = setInterval(() => {
        if (this.tripStartTime) {
          this.tripDuration = Date.now() - this.tripStartTime;
        }
      }, 1000);
    },

    stopDurationTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    // Car-specific methods


    getModelPlaceholder() {
      if (!this.trip.data.vehicleMake) {
        return 'Select make first';
      }
      return this.models.length ? 'Select Model' : 'Loading...';
    },

    // Utility methods
    formatDistance(distance) {
      const numDistance = Number(distance);
      return isNaN(numDistance) ? 0 : numDistance.toFixed(2);
    },

    formatDuration(duration) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || !numDuration) return '00:00:00';

      const hours = Math.floor(numDuration / (1000 * 60 * 60));
      const minutes = Math.floor((numDuration % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((numDuration % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    cleanup() {
      this.stopDurationTimer();
      if (this.map) {
        try {
          // Remove all event listeners first
          this.map.off();
          this.map.remove();
          console.log("🧹 Leaflet map removed safely.");
        } catch (err) {
          console.warn("⚠ Leaflet cleanup warning:", err.message);
        } finally {
          this.map = null;
        }
      }

      // Defensive: clear cached leaflet container if still present
      const mapEl = this.$refs.mapContainer;
      if (mapEl && mapEl._leaflet_id) {
        mapEl._leaflet_id = null;
      }
    },

    handleDestinationSelected(dest){
      this.destination = dest;
      this.calculateRoutes();
    },

    handleDestinationCleared(){
      this.destination = null;
      this.calculatedRoutes = null;
      this.selectedRouteType = 'fastest';
    },

    // Route Calculation
    async calculateRoutes(){
      if (!this.destination || !this.userLocation) return;

      this.calculating = true;

      try {
        const response = await fetch(`${API_BASE}/routes/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: {
              lat: this.userLocation.lat,
              lon: this.userLocation.lng
            },
            destination: this.destination,
            enabled_modes: this.enabledModes
          })
        });

        if (!response.ok) throw new Error('Route calculation failed');

        const data = await response.json();

        if (data.status === 'error') {
          alert(data.message);
          return;
        }

        // Import PlannedRoute at top: import PlannedRoute from '@/classes/PlannedRoute';
        this.calculatedRoutes = new PlannedRoute(data);
        this.selectedRouteType = 'fastest'; // Default selection

      } catch (error) {
        console.error('Route calculation error:', error);
        alert('Failed to calculate routes. Please try again.');
      } finally {
        this.calculating = false;
      }
    },
    // ROUTE SELECTION
    handleRouteSelected(routeType) {
      this.selectedRouteType = routeType;
    },

    handleRouteClicked(routeType) {
      this.selectedRouteType = routeType;
    }
  }
};
</script>

<style scoped>
.live-tracking-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.map-section {
  position: relative;
  margin-bottom: 20px;
}

.tracking-map {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.map-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.distance-display {
  margin-bottom: 5px;
}

.distance-label {
  font-weight: bold;
  color: #666;
}

.distance-value {
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
  margin-left: 5px;
}

.tracking-status {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #28a745;
  font-weight: bold;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  background: #28a745;
  border-radius: 50%;
  margin-right: 5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.controls-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.control-button {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.start-button {
  background: #28a745;
  color: white;
}

.start-button:hover:not(:disabled) {
  background: #218838;
}

.start-button.active {
  background: #17a2b8;
}

.end-button {
  background: #dc3545;
  color: white;
}

.end-button:hover:not(:disabled) {
  background: #c82333;
}

.control-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.trip-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.additional-fields {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.additional-fields h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.field-group {
  margin-bottom: 15px;
}

.field-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.field-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.gps-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 10px;
}

.gps-available {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.gps-checking {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.gps-unavailable,
.gps-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 18px;
}

/* Adjust map height when routes are shown */
.map-section.with-routes .tracking-map {
  height: 250px; /* Reduced height when showing route cards */
}
</style>
