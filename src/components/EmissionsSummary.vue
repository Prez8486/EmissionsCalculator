<template>
  <div class="emissions-summary">
    <h3>Emissions Summary</h3>

    <!-- Transport Mode Display -->
    <div class="transport-info">
      <div class="transport-icon">{{ transportIcon }}</div>
      <div class="transport-name">{{ transportName }}</div>
    </div>

    <!-- Emissions Results -->
    <div class="results-grid">
      <div class="result-card primary">
        <div class="result-label">Total Emissions</div>
        <div class="result-value">{{ formatEmission(emission) }}</div>
        <div class="result-unit">tonnes CO₂</div>
      </div>

      <div v-if="tripData.distance" class="result-card">
        <div class="result-label">Distance</div>
        <div class="result-value">{{ formatDistance(tripData.distance) }}</div>
        <div class="result-unit">km</div>
      </div>

      <div v-if="emissionPerKm" class="result-card">
        <div class="result-label">Per Kilometer</div>
        <div class="result-value">{{ formatEmission(emissionPerKm) }}</div>
        <div class="result-unit">tonnes CO₂/km</div>
      </div>
    </div>

    <!-- Additional Trip Details -->
    <div v-if="hasAdditionalDetails" class="trip-details">
      <h4>Trip Details</h4>
      <div class="details-list">
        <!-- Car specific details -->
        <div v-if="transportMode === 'car'" class="detail-item">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">{{ tripData.vehicleMake }} {{ tripData.vehicleModel }}</span>
        </div>
        <div v-if="transportMode === 'car' && tripData.trips > 1" class="detail-item">
          <span class="detail-label">Weekly Trips:</span>
          <span class="detail-value">{{ tripData.trips }}</span>
        </div>
        <div v-if="transportMode === 'car' && tripData.extraLoad !== 'none'" class="detail-item">
          <span class="detail-label">Extra Load:</span>
          <span class="detail-value">{{ formatExtraLoad(tripData.extraLoad) }}</span>
        </div>

        <!-- Flight specific details -->
        <div v-if="transportMode === 'flight'" class="detail-item">
          <span class="detail-label">Route:</span>
          <span class="detail-value">{{ tripData.fromAirport }} → {{ tripData.toAirport }}</span>
        </div>
        <div v-if="transportMode === 'flight'" class="detail-item">
          <span class="detail-label">Class:</span>
          <span class="detail-value">{{ formatFlightClass(tripData.flightClass) }}</span>
        </div>
        <div v-if="transportMode === 'flight' && tripData.passengers > 1" class="detail-item">
          <span class="detail-label">Passengers:</span>
          <span class="detail-value">{{ tripData.passengers }}</span>
        </div>
        <div v-if="transportMode === 'flight' && tripData.roundTrip" class="detail-item">
          <span class="detail-label">Trip Type:</span>
          <span class="detail-value">Round Trip</span>
        </div>
      </div>
    </div>

    <!-- Environmental Impact Context -->
    <div class="impact-context">
      <h4>Environmental Impact</h4>
      <div class="context-cards">
        <div class="context-card">
          <div class="context-icon">🌳</div>
          <div class="context-text">
            <div class="context-value">{{ treesEquivalent }}</div>
            <div class="context-label">trees needed to offset</div>
          </div>
        </div>
        <div class="context-card">
          <div class="context-icon">🚗</div>
          <div class="context-text">
            <div class="context-value">{{ kmDrivingEquivalent }} km</div>
            <div class="context-label">average car driving</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message for Auto-saved trips -->
    <div v-if="autoSaved" class="auto-save-message">
      ✅ Trip automatically saved to your history!
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmissionsSummary',

  props: {
    emission: {
      type: Number,
      required: true
    },
    transportMode: {
      type: String,
      required: true
    },
    tripData: {
      type: Object,
      default: () => ({})
    },
    autoSaved: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    transportIcon() {
      const icons = {
        car: '🚗',
        bus: '🚌',
        tram: '🚋',
        metro: '🚇',
        flight: '✈️'
      };
      return icons[this.transportMode] || '🚌';
    },

    transportName() {
      const names = {
        car: 'Car Trip',
        bus: 'Bus Journey',
        tram: 'Tram Ride',
        metro: 'Metro Trip',
        flight: 'Flight'
      };
      return names[this.transportMode] || 'Transport';
    },

    emissionPerKm() {
      if (this.tripData.distance && this.tripData.distance > 0) {
        return this.emission / this.tripData.distance;
      }
      return null;
    },

    hasAdditionalDetails() {
      if (this.transportMode === 'car') {
        return this.tripData.vehicleMake || this.tripData.vehicleModel || this.tripData.trips > 1;
      }
      if (this.transportMode === 'flight') {
        return this.tripData.fromAirport || this.tripData.toAirport || this.tripData.flightClass;
      }
      return false;
    },

    // Environmental impact calculations
    treesEquivalent() {
      // Rough estimate: 1 tree absorbs ~22kg CO2 per year
      const treesNeeded = (this.emission * 1000) / 22; // Convert tonnes to kg
      return Math.ceil(treesNeeded);
    },

    kmDrivingEquivalent() {
      // Average car emits ~0.12kg CO2/km
      const avgCarEmissionPerKm = 0.00012; // tonnes CO2/km
      const equivalentKm = this.emission / avgCarEmissionPerKm;
      return Math.round(equivalentKm);
    }
  },

  methods: {
    formatEmission(value) {
      if (value < 0.001) {
        return (value * 1000).toFixed(1) + 'g';
      }
      return value.toFixed(3);
    },

    formatDistance(value) {
      return (value || 0).toFixed(2);
    },

    formatExtraLoad(load) {
      const labels = {
        'none': 'None',
        'caravan': 'Caravan',
        'boat': 'Boat',
        'trailer-light': 'Light Trailer',
        'trailer-medium': 'Medium Trailer',
        'trailer-heavy': 'Heavy Trailer'
      };
      return labels[load] || load;
    },

    formatFlightClass(flightClass) {
      const labels = {
        'economy': 'Economy',
        'premium': 'Premium Economy',
        'business': 'Business',
        'first': 'First Class'
      };
      return labels[flightClass] || flightClass;
    }
  }
};
</script>

<style scoped>
.emissions-summary {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.emissions-summary h3 {
  margin: 0 0 20px 0;
  color: #333;
  text-align: center;
}

.transport-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 12px;
}

.transport-icon {
  font-size: 2rem;
}

.transport-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #495057;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.result-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.result-card.primary {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  transform: scale(1.05);
}

.result-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.result-card.primary .result-label {
  color: rgba(255, 255, 255, 0.9);
}

.result-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.result-card.primary .result-value {
  color: white;
}

.result-unit {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 4px;
}

.result-card.primary .result-unit {
  color: rgba(255, 255, 255, 0.8);
}

.trip-details {
  margin-bottom: 24px;
}

.trip-details h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 1rem;
}

.details-list {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  color: #333;
  font-weight: 600;
}

.impact-context h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 1rem;
}

.context-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.context-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.context-icon {
  font-size: 1.5rem;
}

.context-text {
  flex: 1;
}

.context-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.context-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 2px;
}

.auto-save-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  margin-top: 16px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
  }

  .context-cards {
    grid-template-columns: 1fr;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
