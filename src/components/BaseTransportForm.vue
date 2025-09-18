<template>
  <div class="transport-form-container">
    <!-- Transport Mode Header -->
    <div class="transport-header">
      <h2>{{ config?.icon }} {{ config?.name }} Trip</h2>
      <div class="mode-indicator">
        {{ isLiveMode ? '📍 Live Tracking' : '📝 Manual Entry' }}
      </div>
    </div>

    <!-- Live Tracking Mode (Mobile) -->
    <LiveTrackingUI
      v-if="isLiveMode && trip"
      :trip="trip"
      :is-active="tripState.isActive"
      :distance="tripState.data.distance"
      :loading="tripState.loading"
      @start-trip="startTrip"
      @end-trip="endTrip"
    />

    <!-- Manual Input Mode (Web) -->
    <ManualInputUI
      v-else-if="!isLiveMode && trip"
      :trip="trip"
      :form-data="tripState.data"
      :errors="tripState.errors"
      :loading="tripState.loading"
      :plugins="plugins"
      @update-field="updateField"
      @calculate="calculateEmissions"
    />

    <!-- Emissions Results (Both Modes) -->
    <EmissionsSummary
      v-if="tripState.emission"
      :emission="tripState.emission"
      :transport-mode="transportMode"
      :trip-data="tripState.data"
    />

    <!-- Save Button (Manual Mode Only) -->
    <div v-if="!isLiveMode && tripState.emission" class="save-section">
      <button
        @click="saveTrip"
        :disabled="tripState.loading"
        class="save-button"
      >
        {{ tripState.loading ? 'Saving...' : 'Save to History' }}
      </button>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" class="status-message" :class="messageType">
      {{ statusMessage }}
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { LiveTrip } from '../models/LiveTrip.js';
import { ManualTrip } from '../models/ManualTrip.js';
import { CarAPIPlugin } from '../plugins/carAPI.js';
import { FlightAPIPlugin } from '../plugins/flightAPI.js';

import LiveTrackingUI from './LiveTrackingUI.vue';
import ManualInputUI from './ManualTrackingUI.vue';
import EmissionsSummary from './EmissionsSummary.vue';

export default {
  name: 'BaseTransportForm',
  components: {
    LiveTrackingUI,
    ManualInputUI,
    EmissionsSummary
  },

  props: {
    transportMode: {
      type: String,
      required: true,
      validator: (value) => ['car', 'bus', 'tram', 'metro', 'flight'].includes(value)
    }
  },

  data() {
    return {
      trip: null,
      tripState: {
        data: {}
      },
      plugins: {},
      isLiveMode: false,
      statusMessage: '',
      errorMessage: '',
      messageType: 'info'
    };
  },

  computed: {
    config() {
      return this.trip?.config || null;
    },

    userId() {
      // Get from auth store or localStorage
      return localStorage.getItem('userId') || 'anonymous';
    }
  },

  async mounted() {
    try {
      // Ensure transportMode is passed
      if (!this.transportMode) throw new Error('Missing transportMode prop');

      // Initialize the trip asynchronously
      await this.initializeTrip();
    } catch (err) {
      console.error('Failed to initialize trip:', err);
    }
  },

  beforeUnmount() {
    if (this.trip) {
      this.trip.destroy();
    }
  },

  methods: {
    // Detect platform and initialize appropriate trip type
    async initializeTrip() {
      try {
        // Advanced platform detection
        this.isLiveMode = await this.detectMobilePlatform();

        // Create trip instance
        if (this.isLiveMode) {
          this.trip = new LiveTrip(this.transportMode, this.userId, {
            onStateChange: this.handleStateChange,
            onDataUpdate: this.handleDataUpdate,
            onError: this.handleError,
            onLocationUpdate: this.handleLocationUpdate,
            onDistanceUpdate: this.handleDistanceUpdate
          });
        } else {
          this.trip = new ManualTrip(this.transportMode, this.userId, {
            onStateChange: this.handleStateChange,
            onDataUpdate: this.handleDataUpdate,
            onError: this.handleError
          });
        }

        // Load plugins
        await this.loadPlugins();

        // Initialize trip state
        this.tripState = this.trip.getState();

        // Auto-start manual trips (they just show the form)
        if (!this.isLiveMode) {
          await this.trip.startTrip();
        }

      } catch (error) {
        console.error('Failed to initialize trip:', error);
        this.handleError('Initialization Error', error.message);
      }
    },

    // Advanced platform detection with GPS check
    async detectMobilePlatform() {
      const { platformDetector } = await import('../utils/platformDetector.js');

      // First check if it's definitely a mobile app
      if (platformDetector.isCordovaApp() || platformDetector.isCapacitorApp()) {
        console.log('Detected: Native mobile app');
        return true;
      }

      // Check if it's a PWA in standalone mode
      if (platformDetector.isPWAStandalone()) {
        console.log('Detected: PWA in standalone mode');
        return true;
      }

      // For web browsers, check GPS availability and mobile characteristics
      if (platformDetector.isMobileDevice()) {
        const gpsCheck = await platformDetector.checkGPSAvailability();

        if (gpsCheck.available) {
          console.log('Detected: Mobile web with GPS - using live mode');
          return true;
        } else {
          console.log('Detected: Mobile web without GPS - using manual mode');
          this.showMessage(`GPS not available: ${gpsCheck.reason}. Using manual entry mode.`, 'info');
          return false;
        }
      }

      // Desktop/laptop - always use manual mode
      console.log('Detected: Desktop/web browser - using manual mode');
      return false;
    },

    // Load transport-specific plugins
    async loadPlugins() {
      const availablePlugins = {};

      // Load car API plugin
      if (this.trip.config.plugins.includes('carAPI')) {
        availablePlugins.carAPI = new CarAPIPlugin();
      }

      // Load flight API plugin
      if (this.trip.config.plugins.includes('flightAPI')) {
        availablePlugins.flightAPI = new FlightAPIPlugin();
      }

      this.plugins = availablePlugins;
      await this.trip.loadPlugins(availablePlugins);
    },

    // Trip control methods
    async startTrip() {
      const success = await this.trip.startTrip();
      if (success) {
        this.showMessage('Trip started successfully!', 'success');
      }
    },

    async endTrip() {
      const success = await this.trip.endTrip();
      if (success && this.isLiveMode) {
        this.showMessage('Trip ended and automatically saved!', 'success');
        // Redirect after a short delay
        setTimeout(() => {
          this.$router.push('/home');
        }, 2000);
      }
    },

    async calculateEmissions() {
      const success = await this.trip.calculateEmissions();
      if (success) {
        this.showMessage('Emissions calculated successfully!', 'success');
      }
    },

    async saveTrip() {
      const success = await this.trip.saveTrip();
      if (success) {
        this.showMessage('Trip saved to history!', 'success');
        // Redirect after a short delay
        setTimeout(() => {
          this.$router.push('/home');
        }, 2000);
      }
    },

    // Form handling for manual mode
    updateField(fieldName, value) {
      if (this.trip && this.trip.updateField) {
        this.trip.updateField(fieldName, value);
      }
    },

    // Event handlers from trip classes
    handleStateChange(state) {
      this.tripState = { ...this.tripState, ...state };

      if (state.message) {
        this.showMessage(state.message, state.autoSaved ? 'success' : 'info');
      }
    },

    handleDataUpdate(data) {
      this.tripState.data = { ...this.tripState.data, ...data };
    },

    handleError(type, message) {
      this.errorMessage = `${type}: ${message}`;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    },

    handleLocationUpdate(position) {
      // Handle GPS location updates for live tracking
      console.log('Location update:', position);
    },

    handleDistanceUpdate(distance) {
      // Handle real-time distance updates
      console.log('Distance update:', distance);
    },

    // UI helpers
    showMessage(message, type = 'info') {
      this.statusMessage = message;
      this.messageType = type;

      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    }
  }
};
</script>

<style scoped>
.transport-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.transport-header {
  text-align: center;
  margin-bottom: 20px;
}

.transport-header h2 {
  margin: 0;
  color: #333;
}

.mode-indicator {
  margin-top: 10px;
  padding: 8px 16px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  display: inline-block;
}

.save-section {
  margin-top: 20px;
  text-align: center;
}

.save-button {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background: #218838;
}

.save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  text-align: center;
}
</style>
