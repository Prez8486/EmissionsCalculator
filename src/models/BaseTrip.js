import { getTransportConfig } from "@/config/transportConfig";

export class BaseTrip {
  constructor(transportMode, userId, options = {}){
    if (this.constructor === BaseTrip) {
      throw new Error("Abstract classes can't be instantiated.");
    }

    this.transportMode = transportMode;
    this.userId = userId;
    this.options = options;

    this.config = getTransportConfig(transportMode);
    if (!this.config) {
      throw new Error(`Unsupported transport mode: ${transportMode}`);
    }

    //Trip State
    this.isActive = false;
    this.isCompleted = false;
    this.data = this.initializeData();
    this.emission = null;
    this.loading = false;
    this.errors = {};

    //Plugin storage
    this.plugins = {};

    // Callbacks for UI updates
    this.onStateChange = options.onStateChange || (() => {});
    this.onDataUpdate = options.onDataUpdate || (() => {});
    this.onError = options.onError || (() => {});
  }

  // Initialize data with default values from config
  initializeData() {
    const data = {};

    Object.entries(this.config.fields).forEach(([key, fieldConfig]) => {
      if (fieldConfig.default !== undefined) {
        data[key] = fieldConfig.default;
      } else if (fieldConfig.type === 'number') {
        data[key] = 0;
      } else if (fieldConfig.type === 'checkbox') {
        data[key] = false;
      } else {
        data[key] = '';
      }
    });

    return data;
  }

  // Abstract methods - must be implemented by subclasses
  async startTrip() {
    throw new Error('startTrip() must be implemented by subclass');
  }

  async endTrip() {
    throw new Error('endTrip() must be implemented by subclass');
  }

  // Common validation logic
  validate() {
    this.errors = {};
    const { required, custom } = this.config.validation;

    // Check required fields
    required.forEach(field => {
      if (!this.data[field] || this.data[field] === '') {
        this.errors[field] = `${field} is required`;
      }
    });

    // Check custom validation rules
    if (custom) {
      Object.entries(custom).forEach(([field, validator]) => {
        if (field === 'airports' && this.transportMode === 'flight') {
          // Special case for flight airport validation
          const error = validator(this.data);
          if (error) {
            this.errors.airports = error;
          }
        } else if (this.data[field] !== undefined) {
          const error = validator(this.data[field]);
          if (error) {
            this.errors[field] = error;
          }
        }
      });
    }

    return Object.keys(this.errors).length === 0;
  }

  // Calculate emissions using the API
  async calculateEmissions() {
    if (!this.validate()) {
      this.onError('Validation failed', this.errors);
      return false;
    }

    try {
      this.loading = true;
      this.onStateChange({ loading: true });

      const payload = this.config.emissionsPayload(this.data);
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth token if available (required for some endpoints)
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://136.186.108.171${this.config.api.emissions}`, {
        method: this.config.api.method,
        headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Calculation failed');
      }

      // Extract emission data (handle different response formats)
      let emissionKg;
      if (result.data?.co2e_kg) {
        emissionKg = result.data.co2e_kg;
      } else if (result.emissionKg) {
        emissionKg = result.emissionKg;
      } else if (result.data) {
        emissionKg = result.data;
      } else {
        throw new Error('Invalid response format');
      }

      this.emission = emissionKg / 1000; // Convert to tonnes
      this.data.emissionKg = emissionKg;

      this.onDataUpdate({ emission: this.emission, emissionKg });
      return true;

    } catch (error) {
      console.error('Emission calculation failed:', error);
      this.onError('Failed to calculate emissions', error.message);
      return false;
    } finally {
      this.loading = false;
      this.onStateChange({ loading: false });
    }
  }

  // Save trip to backend
  async saveTrip() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.onError('Authentication required', 'You must be logged in to save trips');
      return false;
    }

    if (!this.emission) {
      this.onError('No data to save', 'Please calculate emissions first');
      return false;
    }

    try {
      this.loading = true;
      this.onStateChange({ loading: true });

      const payload = this.config.savePayload(this.data);

      const response = await fetch('http://136.186.108.171/api/emissions/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Save failed');
      }

      this.isCompleted = true;
      this.onStateChange({ completed: true });
      return true;

    } catch (error) {
      console.error('Save trip failed:', error);
      this.onError('Failed to save trip', error.message);
      return false;
    } finally {
      this.loading = false;
      this.onStateChange({ loading: false });
    }
  }

  // Load and initialize plugins
  async loadPlugins(availablePlugins = {}) {
    for (const pluginName of this.config.plugins) {
      if (availablePlugins[pluginName]) {
        this.plugins[pluginName] = availablePlugins[pluginName];

        // Initialize plugin if it has an init method
        if (this.plugins[pluginName].init) {
          await this.plugins[pluginName].init(this);
        }
      } else {
        console.warn(`Plugin ${pluginName} not available for ${this.transportMode}`);
      }
    }
  }

  // Update trip data
  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.onDataUpdate(this.data);
  }

  // Get current trip state
  getState() {
    return {
      transportMode: this.transportMode,
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      data: this.data,
      emission: this.emission,
      loading: this.loading,
      errors: this.errors,
      config: this.config
    };
  }

  // Reset trip to initial state
  reset() {
    this.isActive = false;
    this.isCompleted = false;
    this.data = this.initializeData();
    this.emission = null;
    this.loading = false;
    this.errors = {};
    this.onStateChange(this.getState());
  }

  // Cleanup resources
  destroy() {
    // Cleanup plugins
    Object.values(this.plugins).forEach(plugin => {
      if (plugin.destroy) {
        plugin.destroy();
      }
    });

    this.plugins = {};
  }
}
