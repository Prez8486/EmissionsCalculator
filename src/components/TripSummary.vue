<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h2>🌍 Post-Trip Analysis</h2>
        <button class="close-icon" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <!-- Map Section with Route Overlay -->
        <div class="map-section">
          <div ref="mapContainer" class="trip-map"></div>

          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-line actual"></span>
              <span>Your Route</span>
            </div>
            <div v-if="hasGreenAlternative" class="legend-item">
              <span class="legend-line green"></span>
              <span>Green Alternative</span>
            </div>
          </div>
        </div>

        <!-- Your Trip Stats -->
        <div class="stats-section">
          <h3>📊 Your Trip</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📏</div>
              <div class="stat-value">{{ tripData.distanceDisplay }}</div>
              <div class="stat-label">Distance</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value">{{ tripData.durationDisplay }}</div>
              <div class="stat-label">Duration</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💨</div>
              <div class="stat-value">{{ tripData.emissionDisplay }}</div>
              <div class="stat-label">Emissions</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🚀</div>
              <div class="stat-value">{{ tripData.averageSpeedDisplay }}</div>
              <div class="stat-label">Avg Speed</div>
            </div>
          </div>
        </div>

        <!-- Green Alternative Comparison (if exists) -->
        <div v-if="hasGreenAlternative" class="comparison-section">
          <h3>🌱 What You Could Have Saved</h3>
          <div class="comparison-box" :class="comparisonClass">
            <div class="comparison-stat">
              <div class="comparison-label">CO₂ Savings</div>
              <div class="comparison-value savings">
                {{ formatEmission(analysis.comparison.emissions_saved_kg) }}
                <span class="percentage">({{ analysis.comparison.emissions_saved_percent }}%)</span>
              </div>
            </div>
            <div class="comparison-stat">
              <div class="comparison-label">Time Difference</div>
              <div class="comparison-value time">
                +{{ analysis.greenest_alternative.time_min.toFixed(0) }} min
              </div>
            </div>
            <div class="comparison-stat">
              <div class="comparison-label">Alternative Route</div>
              <div class="comparison-value modes">
                {{ formatModes(analysis.greenest_alternative.modes_used) }}
              </div>
            </div>
          </div>
          <p class="comparison-message">{{ analysis.comparison.message }}</p>
        </div>

        <!-- No Green Alternative Message -->
        <div v-else class="no-alternative-section">
          <div class="success-badge">✅ Efficient Route</div>
          <p>{{ analysis?.message || 'You took an efficient route! No greener alternative was available.' }}</p>
        </div>

        <!-- Environmental Impact -->
        <div class="impact-section">
          <h3>🌍 Environmental Impact</h3>
          <div class="impact-grid">
            <div class="impact-card">
              <div class="impact-icon">🌳</div>
              <div class="impact-value">{{ individualImpact.trees_needed }}</div>
              <div class="impact-label">Trees Needed</div>
              <div class="impact-sublabel">to offset annually</div>
            </div>
            <div class="impact-card">
              <div class="impact-icon">🍾</div>
              <div class="impact-value">{{ individualImpact.plastic_bottles_equivalent }}</div>
              <div class="impact-label">Plastic Bottles</div>
              <div class="impact-sublabel">equivalent CO₂</div>
            </div>
            <div class="impact-card">
              <div class="impact-icon">🚗</div>
              <div class="impact-value">{{ calculateCarKmEquivalent(tripData.emission).toFixed(1) }} km</div>
              <div class="impact-label">Average Car</div>
              <div class="impact-sublabel">driving equivalent</div>
            </div>
          </div>
        </div>

        <!-- Melbourne Collective Impact (only if green alternative exists) -->
        <div v-if="hasGreenAlternative && collectiveImpact" class="collective-section">
          <h3>🏙️ If All of Melbourne Made This Switch</h3>
          <p class="collective-intro">Impact if {{ formatNumber(collectiveImpact.population) }} people switched for {{ collectiveImpact.trips_per_year }} days:</p>

          <div class="collective-grid">
            <div class="collective-card">
              <div class="collective-icon">💨</div>
              <div class="collective-value">{{ formatNumber(collectiveImpact.annual_savings_tonnes) }} tonnes</div>
              <div class="collective-label">CO₂ Saved Annually</div>
            </div>
            <div class="collective-card">
              <div class="collective-icon">🌳</div>
              <div class="collective-value">{{ formatNumber(collectiveImpact.trees_equivalent) }}</div>
              <div class="collective-label">Trees to Offset</div>
            </div>
            <div class="collective-card">
              <div class="collective-icon">🌊</div>
              <div class="collective-value">{{ collectiveImpact.sea_level_prevented_mm.toFixed(2) }}mm</div>
              <div class="collective-label">Sea-Level Rise Prevented</div>
            </div>
            <div class="collective-card">
              <div class="collective-icon">🌡️</div>
              <div class="collective-value">{{ collectiveImpact.temperature_prevented_celsius.toFixed(6) }}°C</div>
              <div class="collective-label">Temperature Impact Prevented</div>
            </div>
          </div>
        </div>

        <!-- Auto-save Notice -->
        <div v-if="tripData.autoSaved" class="auto-save-notice">
          ✅ Trip automatically saved to your history!
        </div>
      </div>
      <button class="share-btn" @click="shareToFeed">Share to Feed</button>
      <div class="modal-footer">
        <button class="close-btn" @click="handleClose">
          {{ tripData.autoSaved ? 'Close & Continue' : 'Close' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE } from '@/config/apiConfig';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'TripSummary',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    tripData: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      map: null
    };
  },

  computed: {
    analysis() {
      return this.tripData.analysis || null;
    },

    hasGreenAlternative() {
      return this.analysis?.has_green_alternative || false;
    },
    

    individualImpact() {
      return this.analysis?.environmental_impact?.individual || {
        trees_needed: 0,
        plastic_bottles_equivalent: 0,
        sea_level_rise_mm: 0,
        temperature_impact_celsius: 0,
        disaster_frequency_increase_percent: 0
      };
    },

    collectiveImpact() {
      return this.analysis?.environmental_impact?.collective || null;
    },

    comparisonClass() {
      if (!this.analysis?.comparison) return '';
      return this.analysis.comparison.is_better ? 'positive' : 'neutral';
    }
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.initializeMap();
        });
      } else {
        this.destroyMap();
      }
    }
  },

  beforeUnmount() {
    this.destroyMap();
  },

  methods: {
    initializeMap() {
      if (this.map || !this.$refs.mapContainer) return;

      try {
        const actualRoute = this.analysis?.actual?.route_coordinates || this.tripData.path || [];

        if (actualRoute.length === 0) {
          console.warn('No route data available for map');
          return;
        }

        // Get center point
        const centerLat = actualRoute[0].lat || actualRoute[0][0];
        const centerLng = actualRoute[0].lon || actualRoute[0].lng || actualRoute[0][1];

        // Create map
        this.map = L.map(this.$refs.mapContainer).setView([centerLat, centerLng], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Draw actual route (red)
        const actualCoords = actualRoute.map(point => {
          if (Array.isArray(point)) return point;
          return [point.lat, point.lon || point.lng];
        });

        L.polyline(actualCoords, {
          color: '#dc3545',
          weight: 5,
          opacity: 0.7
        }).addTo(this.map);

        // Add start marker
        L.marker(actualCoords[0], {
          icon: L.divIcon({
            className: 'custom-marker start-marker',
            html: '<div style="background: #28a745; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [12, 12]
          })
        }).bindPopup('Start').addTo(this.map);

        // Add end marker
        L.marker(actualCoords[actualCoords.length - 1], {
          icon: L.divIcon({
            className: 'custom-marker end-marker',
            html: '<div style="background: #dc3545; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [12, 12]
          })
        }).bindPopup('End').addTo(this.map);

        // Draw green alternative if exists
        if (this.hasGreenAlternative) {
          const greenRoute = this.analysis.greenest_alternative.route_coordinates || [];

          if (greenRoute.length > 0) {
            const greenCoords = greenRoute.map(point => [point.lat, point.lon || point.lng]);

            L.polyline(greenCoords, {
              color: '#28a745',
              weight: 5,
              opacity: 0.6,
              dashArray: '10, 10'
            }).addTo(this.map);
          }
        }

        // Fit bounds to show all routes
        const allCoords = [...actualCoords];
        if (this.hasGreenAlternative && this.analysis.greenest_alternative.route_coordinates) {
          const greenCoords = this.analysis.greenest_alternative.route_coordinates.map(p => [p.lat, p.lon || p.lng]);
          allCoords.push(...greenCoords);
        }

        this.map.fitBounds(allCoords, { padding: [50, 50] });

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    },
    async shareToFeed() {
      const token = localStorage.getItem("token");

      const body = {
        transportMode: this.tripData.transportMode,
        distance: this.tripData.distance,
        emission: this.tripData.emission
      };

      try {
        const res = await fetch(`${API_BASE}/feed/share-trip`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
          alert("Trip shared successfully!");
          this.$router.push("/feed");
        } else {
          console.error("Share failed:", data);
        }
      } catch (err) {
        console.error("Error sharing trip:", err);
      }
    },

    destroyMap() {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    },

    handleClose() {
      this.$emit('close');
      this.$router.push('/home');
    },

    formatEmission(kg) {
      return `${kg.toFixed(3)} kg CO₂`;
    },

    formatModes(modes) {
      if (!modes || modes.length === 0) return 'N/A';
      const modeIcons = {
        car: '🚗',
        bus: '🚌',
        tram: '🚊',
        train: '🚆',
        walk: '🚶'
      };
      return modes.map(m => modeIcons[m] || m).join(' → ');
    },

    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toLocaleString();
    },

    calculateCarKmEquivalent(emissionsKg) {
      // Average car emits ~0.12kg CO2/km
      const avgCarEmissionPerKm = 0.12; // kg CO2/km
      return emissionsKg / avgCarEmissionPerKm;
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow-y: auto;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.close-icon {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-icon:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 24px;
}

.map-section {
  position: relative;
  margin-bottom: 24px;
}

.trip-map {
  width: 100%;
  height: 350px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e9ecef;
}

.map-legend {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-line {
  width: 30px;
  height: 4px;
  border-radius: 2px;
}

.legend-line.actual {
  background: #dc3545;
}

.legend-line.green {
  background: #28a745;
}

.stats-section,
.comparison-section,
.no-alternative-section,
.impact-section,
.collective-section {
  margin-bottom: 24px;
}

.stats-section h3,
.comparison-section h3,
.impact-section h3,
.collective-section h3 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.comparison-box {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.comparison-box.positive {
  background: #d4edda;
  border: 2px solid #28a745;
}

.comparison-stat {
  text-align: center;
}

.comparison-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.comparison-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.comparison-value.savings {
  color: #28a745;
}

.comparison-value .percentage {
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 4px;
}

.comparison-message {
  text-align: center;
  margin-top: 16px;
  color: #495057;
  font-style: italic;
}

.no-alternative-section {
  background: #d4edda;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.success-badge {
  display: inline-block;
  background: #28a745;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}

.impact-grid,
.collective-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.impact-grid {
  grid-template-columns: repeat(3, 1fr);
}

.collective-grid {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.impact-card,
.collective-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}

.impact-icon,
.collective-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.impact-value,
.collective-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.impact-label,
.collective-label {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 600;
}

.impact-sublabel {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 4px;
}

.collective-intro {
  margin-bottom: 16px;
  color: #495057;
  text-align: center;
  font-size: 0.95rem;
}

.auto-save-notice {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  margin-top: 16px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.close-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #0056b3;
}

@media (max-width: 768px) {
  .stats-grid,
  .collective-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .impact-grid {
    grid-template-columns: 1fr;
  }

  .comparison-box {
    grid-template-columns: 1fr;
  }

  .trip-map {
    height: 250px;
  }
}
  .share-btn {
    width: 90%;
    margin: 20px auto 0 auto;
    display: block;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.25);
    transition: all 0.25s ease;
  }

    .share-btn:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, #0056b3, #004494);
      box-shadow: 0 6px 14px rgba(0, 123, 255, 0.35);
    }

    .share-btn:active {
      transform: scale(0.97);
    }
</style>
