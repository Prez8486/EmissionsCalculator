<template>
  <div class="route-comparison-card">
    <div class="routes-container">
      <!-- Fastest Route Card -->
      <div
        class="route-card fastest"
        :class="{ selected: selected === 'fastest' }"
        @click="selectRoute('fastest')"
      >
        <div class="route-header">
          <span class="route-icon">⚡</span>
          <span class="route-title">Fastest</span>
        </div>

        <div class="route-stats">
          <div class="stat">
            <div class="stat-label">Distance</div>
            <div class="stat-value">{{ fastest.total_distance_km }} km</div>
          </div>
          <div class="stat">
            <div class="stat-label">Time</div>
            <div class="stat-value">{{ fastest.total_time_min }} min</div>
          </div>
          <div class="stat">
            <div class="stat-label">Emissions</div>
            <div class="stat-value">{{ fastest.total_emissions_kg }} kg CO₂</div>
          </div>
        </div>

        <div class="modes-used">
          <span
            v-for="mode in fastest.modes_used"
            :key="mode"
            class="mode-badge"
          >
            {{ getModeIcon(mode) }}
          </span>
        </div>

        <div v-if="selected === 'fastest'" class="selected-indicator">
          ✓ Selected
        </div>
      </div>

      <!-- Greenest Route Card -->
      <div
        v-if="showGreenest"
        class="route-card greenest"
        :class="{ selected: selected === 'greenest' }"
        @click="selectRoute('greenest')"
      >
        <div class="route-header">
          <span class="route-icon">🌱</span>
          <span class="route-title">Greenest</span>
        </div>

        <div class="route-stats">
          <div class="stat">
            <div class="stat-label">Distance</div>
            <div class="stat-value">
              {{ greenest.total_distance_km }} km
              <span v-if="greenest.comparison" class="diff">
                (+{{ (greenest.total_distance_km - fastest.total_distance_km).toFixed(1) }})
              </span>
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Time</div>
            <div class="stat-value">
              {{ greenest.total_time_min }} min
              <span v-if="greenest.comparison" class="diff">
                (+{{ greenest.comparison.time_increase_min }})
              </span>
            </div>
          </div>
          <div class="stat highlight">
            <div class="stat-label">Emissions</div>
            <div class="stat-value">
              {{ greenest.total_emissions_kg }} kg CO₂
              <span v-if="greenest.comparison" class="savings">
                ✓ Save {{ greenest.comparison.emissions_saved_kg }} kg
              </span>
            </div>
          </div>
        </div>

        <div class="modes-used">
          <span
            v-for="mode in greenest.modes_used"
            :key="mode"
            class="mode-badge"
          >
            {{ getModeIcon(mode) }}
          </span>
        </div>

        <div v-if="selected === 'greenest'" class="selected-indicator">
          ✓ Selected
        </div>

        <div class="eco-badge">
          🌿 {{ greenest.comparison.emissions_saved_percent }}% less CO₂
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RouteComparisonCard',

  props: {
    fastest: {
      type: Object,
      required: true
    },
    greenest: {
      type: Object,
      default: null
    },
    showGreenest: {
      type: Boolean,
      default: false
    },
    selected: {
      type: String,
      default: 'fastest'
    }
  },

  emits: ['route-selected'],

  methods: {
    selectRoute(routeType) {
      this.$emit('route-selected', routeType);
    },

    getModeIcon(mode) {
      const icons = {
        car: '🚗',
        walk: '🚶',
        train: '🚆',
        tram: '🚊',
        bus: '🚌'
      };
      return icons[mode] || mode;
    }
  }
};
</script>

<style scoped>
.route-comparison-card {
  margin: 15px 0;
}

.routes-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.route-card {
  flex: 1;
  min-width: 160px;
  padding: 15px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-card.selected {
  border-color: #007bff;
  background: #f0f8ff;
}

.route-card.greenest.selected {
  border-color: #28a745;
  background: #f0fff4;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.route-icon {
  font-size: 24px;
}

.route-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.route-stats {
  margin-bottom: 12px;
}

.stat {
  margin-bottom: 8px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.stat.highlight .stat-value {
  color: #28a745;
}

.diff {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.savings {
  display: block;
  font-size: 11px;
  color: #28a745;
  font-weight: 500;
  margin-top: 2px;
}

.modes-used {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.mode-badge {
  font-size: 18px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 4px;
}

.selected-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #007bff;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.greenest .selected-indicator {
  background: #28a745;
}

.eco-badge {
  margin-top: 8px;
  padding: 6px 10px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #155724;
  text-align: center;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .routes-container {
    flex-direction: column;
  }

  .route-card {
    min-width: unset;
  }
}
</style>
