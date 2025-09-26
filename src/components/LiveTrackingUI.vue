<template>
  <div class="live-tracking-container">
    <!-- Map Display -->
    <div class="map-section">
      <div id="tracking-map" class="tracking-map" ref="mapContainer"></div>

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

    <!-- Control Buttons -->
    <div class="controls-section">
      <button
        @click="handleStartTrip"
        :disabled="isActive || loading"
        class="control-button start-button"
        :class="{ 'active': isActive }"
      >
        <span class="button-icon">📍</span>
        {{ isActive ? 'Trip Active' : 'Start Trip' }}
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
    <div v-if="trip && trip.transportMode === 'car'" class="additional-fields">
      <h3>Trip Details</h3>

      <!-- Car Make/Model (populated by plugin) -->
      <div class="car-fields">
        <div class="field-group">
          <label>Car Make:</label>
          <select
            :value="trip.data?.vehicleMake || ''"
            @change="updateMake($event.target.value)"
            :disabled="!makes.length"
          >
            <option value="">{{ makes.length ? 'Select Make' : 'Loading...' }}</option>
            <option v-for="make in makes" :key="make.make" :value="make.make">
              {{ make.make }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label>Car Model:</label>
          <select
            :value="trip.data?.vehicleModel || ''"
            @change="updateModel($event.target.value)"
            :disabled="!models.length || !trip.data?.vehicleMake"
          >
            <option value="">{{ getModelPlaceholder() }}</option>
            <option v-for="model in models" :key="model.model" :value="model.model">
              {{ model.model }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label>Extra Load:</label>
          <select
            :value="trip.data?.extraLoad || 'none'"
            @change="updateExtraLoad($event.target.value)"
          >
            <option value="none">None</option>
            <option value="caravan">Caravan</option>
            <option value="boat">Boat</option>
            <option value="trailer-light">Trailer (Light)</option>
            <option value="trailer-medium">Trailer (Medium)</option>
            <option value="trailer-heavy">Trailer (Heavy)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- GPS Status Indicator -->
    <div class="gps-status" :class="gpsStatusClass">
      <span class="status-icon">{{ gpsStatusIcon }}</span>
      <span class="status-text">{{ gpsStatusText }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LiveTrackingUI',

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
      makes: [],
      models: [],
      gpsStatus: 'checking' // checking, available, unavailable, error
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
    }
  },

  mounted() {
    if (this.trip && this.$refs.mapContainer) {
      this.initializeMap();
    }
    this.checkGPSAvailability();
    this.loadCarData();
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
    }
  },

  methods: {
    async initializeMap() {
      try {
        this.map = await this.trip.initializeMap(this.$refs.mapContainer, {
          zoom: 16
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
        this.gpsStatus = 'error';
      }
    },

    async checkGPSAvailability() {
      if (!navigator.geolocation) {
        this.gpsStatus = 'unavailable';
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              this.gpsStatus = 'available';
              resolve();
            },
            (error) => {
              this.gpsStatus = 'error';
              reject(error);
            },
            { timeout: 5000 }
          );
        });
      } catch (error) {
        this.gpsStatus = error;
      }
    },

    async loadCarData() {
      if (this.trip.transportMode === 'car' && this.trip.plugins.carAPI) {
        // Load makes from plugin
        this.makes = await this.trip.plugins.carAPI.fetchMakes();
      }
    },

    async handleStartTrip() {
      if (this.gpsStatus !== 'available') {
        alert('GPS is not available. Please enable location services.');
        return;
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
    async updateMake(make) {
      this.trip.updateData({ vehicleMake: make, vehicleModel: '' });
      if (make && this.trip.plugins.carAPI) {
        this.models = await this.trip.plugins.carAPI.fetchModels(make);
      } else {
        this.models = [];
      }
    },

    updateModel(model) {
      this.trip.updateData({ vehicleModel: model });
    },

    updateExtraLoad(extraLoad) {
      this.trip.updateData({ extraLoad });
    },

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
        this.map.remove();
        this.map = null;
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
</style>
