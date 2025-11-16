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

    <!-- Time Variance Slider - Only show when NOT active and before route selection -->
    <div v-if="!isActive" class="time-variance-control">
      <div class="slider-header">
        <label class="slider-label">
          Time Flexibility for Greener Routes
        </label>
      </div>

      <div class="slider-container">
        <input
          type="range"
          v-model.number="localTimeVariance"
          min="0"
          max="100"
          step="5"
          class="time-slider"
          @input="handleSliderChange"
        />
        <div class="slider-marks">
          <span class="mark">0%</span>
          <span class="mark">25%</span>
          <span class="mark">50%</span>
          <span class="mark">75%</span>
          <span class="mark">100%</span>
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
        <span class="button-icon">🛑</span>
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

    <!-- AI Toggle Switch -->
    <div v-if="!isActive" class="ai-toggle-section">
      <div class="ai-toggle">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="aiEnabled"
            @change="handleAIToggle"
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-text">
            🤖 Enable AI Transport Detection
          </span>
        </label>
        <div v-if="aiEnabled" class="ai-description">
          AI will analyze sensor data to automatically detect your transport mode
        </div>
      </div>
    </div>

    <!-- Debug Button (remove in production) -->
    <button
      @click="debugMap"
      class="debug-button"
      v-if="!isActive"
    >
      🛠 Debug
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
      currentLocationMarker: null,

      // Time Variance Slider
      maxTimeVariance: 20, // default value
      localTimeVariance: 20, // local copy for slider

      //AI Toggle State
      aiEnabled: false
    };
  },

  computed: {
    preferences() {
      return {
        max_time_variance_percent: this.maxTimeVariance
      };
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
          this.debouncedRecalculateRoutes();
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

       // Set AI mode before starting trip
      if (this.trip) {
        this.trip.setAIMode(this.aiEnabled);
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
      console.log('\n========================================');
      console.log('🔄 CALCULATING ROUTES - FRONTEND');
      console.log('========================================');
      console.log('Start:', this.userLocation);
      console.log('Destination:', this.destination);
      console.log('Enabled Modes:', this.enabledModes);
      console.log('Max Time Variance:', this.maxTimeVariance + '%');
      console.log('========================================\n');

      try {
        const requestBody = {
          start: {
            lat: this.userLocation.lat,
            lon: this.userLocation.lng
          },
          destination: this.destination,
          enabled_modes: this.enabledModes,
          preferences: this.preferences
        };

        console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_BASE}/routes/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 Response Status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Route calculation failed:', errorText);
          throw new Error('Route calculation failed');
        }

        const data = await response.json();
        console.log('\n📥 Route Calculation Response:', data);

        if (data.status === 'error') {
          console.error('❌ Backend returned error:', data.message);
          alert(data.message);
          return;
        }

        if (data.fallback_used) {
          console.log('⚠️ Using OSM Fallback Route');
          console.log('  Source:', data.fallback_source);
        }

        this.calculatedRoutes = new PlannedRoute(data);
        this.selectedRouteType = 'fastest';

        console.log('\n✅ Routes Processed Successfully:');
        console.log('  Fastest:', !!this.calculatedRoutes.fastest);
        console.log('  Greenest:', !!this.calculatedRoutes.greenest);
        console.log('  Show Alternative:', this.calculatedRoutes.show_alternative);

        if (this.calculatedRoutes.fastest) {
          console.log('  Fastest Details:', {
            distance: this.calculatedRoutes.fastest.total_distance_km + ' km',
            time: this.calculatedRoutes.fastest.total_time_min + ' min',
            emissions: this.calculatedRoutes.fastest.total_emissions_kg + ' kg'
          });
        }

        if (this.calculatedRoutes.greenest) {
          console.log('  Greenest Details:', {
            distance: this.calculatedRoutes.greenest.total_distance_km + ' km',
            time: this.calculatedRoutes.greenest.total_time_min + ' min',
            emissions: this.calculatedRoutes.greenest.total_emissions_kg + ' kg'
          });
        }

        console.log('========================================\n');

      } catch (error) {
        console.error('\n❌ ROUTE CALCULATION ERROR:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.log('========================================\n');
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
      console.log('\n=== 🛠 MAP DEBUG ===');
      console.log('Map instance:', this.map);
      console.log('Map has layers:', this.map ? Object.keys(this.map._layers).length : 'No map');
      console.log('User location:', this.userLocation);
      console.log('Destination:', this.destination);
      console.log('Max Time Variance:', this.maxTimeVariance + '%');
      console.log('Enabled Modes:', this.enabledModes);
      console.log('Calculated routes:', this.calculatedRoutes);
      console.log('Has fastest route:', !!this.calculatedRoutes?.fastest);
      console.log('Fastest path coords:', this.calculatedRoutes?.fastest?.path_coordinates?.length);
      console.log('Has greenest route:', !!this.calculatedRoutes?.greenest);
      console.log('Show alternative:', this.calculatedRoutes?.show_alternative);
      console.log('Selected route type:', this.selectedRouteType);
      console.log('Current location marker:', this.currentLocationMarker);

      if (this.map) {
        console.log('Map center:', this.map.getCenter());
        console.log('Map zoom:', this.map.getZoom());
        console.log('Map bounds:', this.map.getBounds());
      }
      console.log('==================\n');
    },

    // Slider Methods
    handleSliderChange() {
      // Update the main value
      this.maxTimeVariance = this.localTimeVariance;

      console.log('🎚️ Time variance changed to:', this.maxTimeVariance + '%');

      // Recalculate routes if we have a destination
      if (this.destination) {
        this.debouncedRecalculateRoutes();
      }
    },

    debouncedRecalculateRoutes() {
      // Debounce route recalculations to avoid too many API calls
      clearTimeout(this.recalcTimer);
      this.recalcTimer = setTimeout(() => {
        console.log('♻️ Recalculating routes with new time variance...');
        this.calculateRoutes();
      }, 800);
    },

    //AI Toggle Methods
    handleAIToggle() {
      console.log('🤖 AI Mode:', this.aiEnabled ? 'ENABLED' : 'DISABLED');

      if (this.aiEnabled) {
        this.showMessage('AI transport detection enabled. Starting sensor collection when trip begins.', 'info');
      } else {
        this.showMessage('AI transport detection disabled.', 'info');
      }

      // Pass AI state to trip instance
      if (this.trip) {
        this.trip.setAIMode(this.aiEnabled);
      }
    },

    // Helper method for messages (add this if you don't have it)
    showMessage(text, type = 'info') {
      // You can use alert for now, or implement a proper toast notification
      if (type === 'info') {
        console.log('💡 ' + text);
      } else if (type === 'warning') {
        console.warn('⚠️ ' + text);
      }
    },
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

/* Time Variance Slider Styles */
.time-variance-control {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  border: 2px solid #e9ecef;
}

.slider-header {
  margin-bottom: 16px;
  text-align: center;
}

.slider-label {
  font-weight: 600;
  color: #495057;
  font-size: 1rem;
}

.slider-container {
  margin-bottom: 12px;
}

.time-slider {
  width: 100%;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, #ffffff 0%, #a8e6a1 25%, #66bb6a 50%, #43a047 75%, #2e7d32 100%);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.time-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 3px solid #2e7d32;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.time-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  border-color: #1b5e20;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
}

.time-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 3px solid #2e7d32;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.time-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  border-color: #1b5e20;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.mark {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .time-variance-control {
    padding: 16px;
  }

  .slider-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .slider-value {
    align-self: flex-end;
  }

  .trip-stats {
    flex-direction: column;
    gap: 10px;
  }

  .controls-section {
    flex-direction: column;
  }
}

.ai-toggle-section {
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.ai-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
  color: #2c3e50;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: #4CAF50;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-text {
  font-size: 1em;
}

.ai-description {
  font-size: 0.9em;
  color: #6c757d;
  padding-left: 62px;
}

</style>
