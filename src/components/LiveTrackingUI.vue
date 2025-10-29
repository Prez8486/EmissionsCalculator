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
      <button
        @click="handleStartTrip"
        :disabled="isActive || loading"
        class="control-button start-button"
        :class="{ 'active': isActive }"
      >
        <span class="button-icon">📍</span>
        {{ startButtonText }}
      </button>

      <button
        @click="handleEndTrip"
        :disabled="!isActive || loading"
        class="control-button end-button"
      >
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

    <!-- Debug Button (remove in production) -->
    <button
      @click="debugMap"
      class="debug-button"
      v-if="!isActive"
    >
      🐛 Debug
    </button>
  </div>
</template>

<script>
import { API_BASE } from '@/config/apiConfig';
import PlannedRoute from '@/models/PlannedRoute';
import DestinationSearchBar from '@/components/LiveTracking/DestinationSearchBar.vue';
import TransportModeSelector from '@/components/LiveTracking/TransportModeSelector.vue';
import RouteComparisonCard from '@/components/LiveTracking/RouteComparisonCard.vue';
import RouteOverlay from '@/components/LiveTracking/RouteOverlay.vue';
import L from 'leaflet';

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
      gpsStatus: 'checking',
      car: { make: '', model: '', extraLoad: '' },

      // Route Planning State
      userLocation: null,
      destination: null,
      enabledModes: ['car', 'walk', 'train', 'tram', 'bus'],
      calculatedRoutes: null,
      selectedRouteType: 'fastest',
      calculating: false,
      recalcTimer: null,
      currentLocationMarker: null
    };
  },

  computed: {
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

    showRouteSelection() {
      return this.destination && this.calculatedRoutes && !this.isActive;
    },

    startButtonText() {
      if (this.isActive) return 'Trip Active';
      if (!this.selectedRouteType || !this.destination) return '🚀 Start Trip';
      const routeName = this.selectedRouteType === 'greenest' ? 'Greenest' : 'Fastest';
      return `🚀 Start with ${routeName} Route`;
    }
  },

  watch: {
    map: {
      handler(newMap) {
        console.log('🗺️ Map instance changed:', !!newMap);
      },
      immediate: true
    },

    calculatedRoutes: {
      handler(newVal) {
        console.log('📊 Calculated routes changed:', !!newVal);
      },
      immediate: true
    },

    isActive(newVal) {
      if (newVal) {
        this.startDurationTimer();
      } else {
        this.stopDurationTimer();
      }
    },

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

  mounted() {
    console.log('🎬 LiveTrackingUI mounted');
    this.loadUserCar();
    this.initLiveTracking();
  },

  beforeUnmount() {
    this.cleanup();
  },

  methods: {
    async initLiveTracking() {
      if (!navigator.geolocation) {
        console.warn("❌ Geolocation not supported, loading fallback map...");
        this.gpsStatus = "unavailable";
        this.map = await this.trip.initializeMap(
          this.$refs.mapContainer,
          { zoom: 16 },
          { lat: -37.8136, lng: 144.9631 }
        );
        this.userLocation = { lat: -37.8136, lng: 144.9631 };
        console.log('🗺️ Map initialized (fallback):', this.map);
        this.showCurrentLocationMarker();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log("✅ GPS available, initializing map...");
          this.gpsStatus = "available";
          this.map = await this.trip.initializeMap(
            this.$refs.mapContainer,
            { zoom: 16 },
            { lat: pos.coords.latitude, lng: pos.coords.longitude }
          );
          this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('🗺️ Map initialized:', this.map);
          this.showCurrentLocationMarker();
        },
        async (err) => {
          console.warn("⚠️ GPS access denied or unavailable:", err);
          this.gpsStatus = "unavailable";
          this.map = await this.trip.initializeMap(
            this.$refs.mapContainer,
            { zoom: 16 },
            { lat: -37.8136, lng: 144.9631 }
          );
          this.userLocation = { lat: -37.8136, lng: 144.9631 };
          console.log('🗺️ Map initialized (fallback):', this.map);
          this.showCurrentLocationMarker();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },

    showCurrentLocationMarker() {
      if (!this.map || !this.userLocation) {
        console.warn('⚠️ Cannot show current location marker - no map or location');
        return;
      }

      // Remove existing marker if any
      if (this.currentLocationMarker) {
        this.map.removeLayer(this.currentLocationMarker);
      }

      this.currentLocationMarker = L.marker(
        [this.userLocation.lat, this.userLocation.lng],
        {
          icon: L.divIcon({
            html: `
              <div style="position: relative; width: 40px; height: 40px;">
                <div style="
                  width: 16px;
                  height: 16px;
                  background: #4285F4;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  position: absolute;
                  top: 12px;
                  left: 12px;
                  z-index: 2;
                "></div>
                <div class="pulse-ring" style="
                  width: 40px;
                  height: 40px;
                  background: rgba(66, 133, 244, 0.3);
                  border-radius: 50%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  animation: pulse 2s infinite;
                  z-index: 1;
                "></div>
              </div>
            `,
            className: 'current-location-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }
      ).addTo(this.map);

      this.currentLocationMarker.bindPopup('📍 Your Location');
      console.log('📍 Current location marker added at', this.userLocation);
    },

    async loadUserCar() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/auth/car`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load car details');

        const data = await res.json();
        if (data.car) {
          this.car = data.car;
          this.trip.updateData({
            vehicleMake: this.car.make,
            vehicleModel: this.car.model,
            extraLoad: this.car.extraLoad
          });
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
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
      };
      return map[load] || 'Unknown';
    },

    async handleStartTrip() {
      if (this.gpsStatus !== 'available') {
        alert('GPS is not available. Please enable location services.');
        return;
      }

      // Set route if planned
      if (this.destination && this.calculatedRoutes) {
        this.trip.setDestination(this.destination);
        this.trip.setPlannedRoute(this.calculatedRoutes, this.selectedRouteType);
        console.log('✅ Route set for trip:', this.selectedRouteType);
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

      if (this.currentLocationMarker && this.map) {
        this.map.removeLayer(this.currentLocationMarker);
        this.currentLocationMarker = null;
      }

      if (this.map) {
        try {
          this.map.off();
          this.map.remove();
          console.log("🧹 Leaflet map removed safely.");
        } catch (err) {
          console.warn("⚠️ Leaflet cleanup warning:", err.message);
        } finally {
          this.map = null;
        }
      }

      const mapEl = this.$refs.mapContainer;
      if (mapEl && mapEl._leaflet_id) {
        mapEl._leaflet_id = null;
      }
    },

    handleDestinationSelected(dest) {
      console.log('🎯 Destination selected:', dest);
      this.destination = dest;
      this.calculateRoutes();
    },

    handleDestinationCleared() {
      console.log('🗑️ Destination cleared');
      this.destination = null;
      this.calculatedRoutes = null;
      this.selectedRouteType = 'fastest';
    },

    async calculateRoutes() {
      if (!this.destination || !this.userLocation) {
        console.warn('⚠️ Cannot calculate routes - missing destination or user location');
        return;
      }

      this.calculating = true;
      console.log('🔄 Calculating routes...', {
        start: this.userLocation,
        destination: this.destination,
        modes: this.enabledModes
      });

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
        console.log('📥 Route calculation response:', data);

        if (data.status === 'error') {
          alert(data.message);
          return;
        }

        this.calculatedRoutes = new PlannedRoute(data);
        this.selectedRouteType = 'fastest';

        console.log('✅ Routes calculated successfully:', {
          fastest: this.calculatedRoutes.fastest,
          greenest: this.calculatedRoutes.greenest,
          showAlternative: this.calculatedRoutes.show_alternative
        });

      } catch (error) {
        console.error('❌ Route calculation error:', error);
        alert('Failed to calculate routes. Please try again.');
      } finally {
        this.calculating = false;
      }
    },

    handleRouteSelected(routeType) {
      console.log('✅ Route selected:', routeType);
      this.selectedRouteType = routeType;
    },

    handleRouteClicked(routeType) {
      console.log('🖱️ Route clicked:', routeType);
      this.selectedRouteType = routeType;
    },

    debugMap() {
      console.log('=== 🐛 MAP DEBUG ===');
      console.log('Map instance:', this.map);
      console.log('Map has layers:', this.map ? Object.keys(this.map._layers).length : 'No map');
      console.log('User location:', this.userLocation);
      console.log('Destination:', this.destination);
      console.log('Calculated routes:', this.calculatedRoutes);
      console.log('Has fastest route:', !!this.calculatedRoutes?.fastest);
      console.log('Fastest path coords:', this.calculatedRoutes?.fastest?.path_coordinates);
      console.log('Has greenest route:', !!this.calculatedRoutes?.greenest);
      console.log('Show alternative:', this.calculatedRoutes?.show_alternative);
      console.log('Selected route type:', this.selectedRouteType);
      console.log('Current location marker:', this.currentLocationMarker);

      if (this.map) {
        console.log('Map center:', this.map.getCenter());
        console.log('Map zoom:', this.map.getZoom());
        console.log('Map bounds:', this.map.getBounds());
      }
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
  top: 70px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 999;
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
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
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

.car-info-card {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.car-info-card h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.car-info-card p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
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

.debug-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  padding: 10px 15px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.debug-button:hover {
  background: #ff5252;
}
</style>
