<template>
  <div class="manual-input-container">
    <form @submit.prevent="handleCalculate" class="transport-form">
      <!-- Flight-specific fields (airports) -->
      <div v-if="trip && trip.transportMode === 'flight'" class="flight-fields">
        <div class="field-group">
          <label>From Airport:</label>
          <input
            v-model="fromKeyword"
            @input="searchAirports('from')"
            placeholder="Type city or airport code"
            class="airport-input"
          />
          <select
            :value="formData.fromAirport"
            @change="updateField('fromAirport', $event.target.value)"
          >
            <option value="">Select Airport</option>
            <option
              v-for="airport in fromAirports"
              :key="airport.iata_code"
              :value="airport.iata_code"
            >
              {{ airport.airport_name }} ({{ airport.iata_code }})
            </option>
          </select>
          <div v-if="errors.fromAirport" class="field-error">
            {{ errors.fromAirport }}
          </div>
        </div>

        <div class="field-group">
          <label>To Airport:</label>
          <input
            v-model="toKeyword"
            @input="searchAirports('to')"
            placeholder="Type city or airport code"
            class="airport-input"
          />
          <select
            :value="formData.toAirport"
            @change="updateField('toAirport', $event.target.value)"
          >
            <option value="">Select Airport</option>
            <option
              v-for="airport in toAirports"
              :key="airport.iata_code"
              :value="airport.iata_code"
            >
              {{ airport.airport_name }} ({{ airport.iata_code }})
            </option>
          </select>
          <div v-if="errors.toAirport" class="field-error">
            {{ errors.toAirport }}
          </div>
        </div>
      </div>

      <!-- Car-specific fields -->
      <div v-if="trip && trip.transportMode === 'car'" class="car-fields">
        <div class="field-group">
          <label>Car Make:</label>
          <select
            :value="formData.vehicleMake"
            @change="updateMake($event.target.value)"
            :disabled="!makes.length"
          >
            <option value="">{{ makes.length ? 'Select Make' : 'Loading...' }}</option>
            <option v-for="make in makes" :key="make.make" :value="make.make">
              {{ make.make }}
            </option>
          </select>
          <div v-if="errors.vehicleMake" class="field-error">
            {{ errors.vehicleMake }}
          </div>
        </div>

        <div class="field-group">
          <label>Car Model:</label>
          <select
            :value="formData.vehicleModel"
            @change="updateField('vehicleModel', $event.target.value)"
            :disabled="!models.length || !formData.vehicleMake"
          >
            <option value="">{{ getModelPlaceholder() }}</option>
            <option v-for="model in models" :key="model.model" :value="model.model">
              {{ model.model }}
            </option>
          </select>
          <div v-if="errors.vehicleModel" class="field-error">
            {{ errors.vehicleModel }}
          </div>
        </div>
      </div>

      <!-- Standard form fields (generated from config) -->
      <div v-if="trip?.config?.fields">
        <div v-for="(fieldConfig, fieldName) in trip.config.fields" :key="fieldName" class="field-group">
          <label>{{ fieldConfig.label }}:</label>

          <!-- Number Input -->
          <input
            v-if="fieldConfig.type === 'number'"
            :value="formData[fieldName]"
            @input="updateField(fieldName, parseFloat($event.target.value) || 0)"
            type="number"
            :min="fieldConfig.min"
            :max="fieldConfig.max"
            :readonly="fieldConfig.readonly"
            class="form-input"
          />

          <!-- Text Input -->
          <input
            v-else-if="fieldConfig.type === 'text'"
            :value="formData[fieldName]"
            @input="updateField(fieldName, $event.target.value)"
            type="text"
            :readonly="fieldConfig.readonly"
            class="form-input"
          />

          <!-- Select Dropdown -->
          <select
            v-else-if="fieldConfig.type === 'select'"
            :value="formData[fieldName]"
            @change="updateField(fieldName, $event.target.value)"
            class="form-select"
          >
            <option v-for="option in fieldConfig.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Checkbox -->
          <label v-else-if="fieldConfig.type === 'checkbox'" class="checkbox-label">
            <input
              :checked="formData[fieldName]"
              @change="updateField(fieldName, $event.target.checked)"
              type="checkbox"
              class="form-checkbox"
            />
            {{ fieldConfig.label }}
          </label>

          <!-- Field Error -->
          <div v-if="errors[fieldName]" class="field-error">
            {{ errors[fieldName] }}
          </div>
        </div>
      </div>

      <!-- Calculate Button -->
      <button
        type="submit"
        :disabled="!canCalculate || loading"
        class="calculate-button"
      >
        {{ loading ? 'Calculating...' : 'Calculate Emissions' }}
      </button>
    </form>

    <!-- Save Button (Only for Manual Mode) -->
    <div v-if="emission && emission > 0" class="save-section">
      <button
        @click="handleSaveTrip"
        :disabled="loading"
        class="save-button"
      >
        {{ loading ? 'Saving...' : 'Save to History' }}
      </button>
    </div>

    <!-- Validation Summary -->
    <div v-if="Object.keys(errors).length > 0" class="validation-summary">
      <h4>Please fix the following errors:</h4>
      <ul>
        <li v-for="(error, field) in errors" :key="field">{{ error }}</li>
      </ul>
    </div>

    <!-- Platform Info -->
    <div class="platform-info">
      <div class="info-badge">
        <span class="badge-icon">🖥️</span>
        <span class="badge-text">Web Version - Manual Entry</span>
      </div>
      <p class="info-text">
        On mobile, this would use GPS tracking automatically.
        Here you can enter trip details manually.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManualInputUI',

  props: {
    trip: {
      type: Object,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    errors: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    plugins: {
      type: Object,
      default: () => ({})
    },
    emission: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      // Flight search state
      fromKeyword: '',
      toKeyword: '',
      fromAirports: [],
      toAirports: [],

      // Car API state
      makes: [],
      models: []
    };
  },

  computed: {
    canCalculate() {
      // Check if all required fields are filled
      const requiredFields = this.trip?.config?.validation.required || [];
      return requiredFields.every(field =>
        this.formData[field] && this.formData[field] !== ''
      ) && Object.keys(this.errors).length === 0;
    }
  },

  mounted() {
    this.loadPluginData();
  },

  methods: {
    async loadPluginData() {
      // Load car makes if car mode
      if (this.trip.transportMode === 'car' && this.plugins.carAPI) {
        this.makes = await this.plugins.carAPI.fetchMakes();
      }
    },

    // Generic field update
    updateField(fieldName, value) {
      this.$emit('update-field', fieldName, value);
    },

    // Car-specific: Update make and load models
    async updateMake(make) {
      this.updateField('vehicleMake', make);

      if (make && this.plugins.carAPI) {
        this.models = await this.plugins.carAPI.fetchModels(make);
      } else {
        this.models = [];
      }

      // Reset model when make changes
      this.updateField('vehicleModel', '');
    },

    // Flight-specific: Search airports
    async searchAirports(type) {
      const keyword = type === 'from' ? this.fromKeyword : this.toKeyword;

      if (!keyword || keyword.length < 3) return;

      if (this.plugins.flightAPI) {
        const airports = await this.plugins.flightAPI.searchAirports(keyword);

        if (type === 'from') {
          this.fromAirports = airports;
        } else {
          this.toAirports = airports;
        }
      }
    },

    handleCalculate() {
      this.$emit('calculate');
    },

    handleSaveTrip() {
      this.$emit('save-trip');
    },

    getModelPlaceholder() {
      if (!this.formData.vehicleMake) {
        return 'Select make first';
      }
      return this.models.length ? 'Select Model' : 'Loading...';
    }
  }
};
</script>

<style scoped>
.manual-input-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.transport-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.field-group {
  margin-bottom: 20px;
}

.field-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  font-weight: normal !important;
  cursor: pointer;
}

.form-input,
.form-select,
.airport-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.airport-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-input:read-only {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.form-checkbox {
  margin-right: 8px;
  transform: scale(1.2);
}

.airport-input {
  margin-bottom: 10px;
}

.flight-fields,
.car-fields {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.calculate-button {
  width: 100%;
  padding: 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calculate-button:hover:not(:disabled) {
  background: #0056b3;
}

.calculate-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
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

.save-button:hover:not(:disabled) {
  background: #218838;
}

.save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.field-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.validation-summary {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.validation-summary h4 {
  margin: 0 0 10px 0;
}

.validation-summary ul {
  margin: 0;
  padding-left: 20px;
}

.platform-info {
  background: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #007bff;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.info-text {
  margin: 0;
  color: #004085;
  font-size: 14px;
}
</style>
