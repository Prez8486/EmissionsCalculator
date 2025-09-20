export class CarAPIPlugin {
  constructor() {
    this.makes = [];
    this.models = [];
    this.loading = false;
    this.cache = {
      makes: null,
      models: new Map() // Cache models by make
    };

    // Callbacks
    this.onMakesLoaded = null;
    this.onModelsLoaded = null;
    this.onError = null;
  }

  // Initialize plugin (called by BaseTrip)
  async init(tripInstance) {
    this.trip = tripInstance;

    // Set up callbacks
    this.onMakesLoaded = (makes) => {
      this.trip.onDataUpdate({ makes, makesLoaded: true });
    };

    this.onModelsLoaded = (models, make) => {
      this.trip.onDataUpdate({ models, modelsLoaded: true, selectedMake: make });
    };

    this.onError = (error) => {
      this.trip.onError('Car API Error', error);
    };

    // Auto-load makes
    await this.fetchMakes();
  }

  // Fetch all car makes
  async fetchMakes() {
    // Return cached data if available
    if (this.cache.makes) {
      this.makes = this.cache.makes;
      this.onMakesLoaded(this.makes);
      return this.makes;
    }

    try {
      this.loading = true;

      const response = await fetch('http://136.186.108.171/api/emissions/car/makes');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.makes = result.data || [];

      // Cache the results
      this.cache.makes = this.makes;

      this.onMakesLoaded(this.makes);
      return this.makes;

    } catch (error) {
      console.error('Failed to fetch car makes:', error);
      this.onError(`Failed to load car makes: ${error.message}`);
      return [];
    } finally {
      this.loading = false;
    }
  }

  // Fetch models for a specific make
  async fetchModels(make) {
    if (!make) {
      this.models = [];
      this.onModelsLoaded([], '');
      return [];
    }

    // Return cached data if available
    if (this.cache.models.has(make)) {
      this.models = this.cache.models.get(make);
      this.onModelsLoaded(this.models, make);
      return this.models;
    }

    try {
      this.loading = true;

      const response = await fetch(
        `http://136.186.108.171/api/emissions/car/models/${encodeURIComponent(make)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.models = result.data || [];

      // Cache the results
      this.cache.models.set(make, this.models);

      // Update trip data
      this.trip.updateData({
        vehicleMake: make,
        vehicleModel: '' // Reset model when make changes
      });

      this.onModelsLoaded(this.models, make);
      return this.models;

    } catch (error) {
      console.error(`Failed to fetch models for ${make}:`, error);
      this.onError(`Failed to load models for ${make}: ${error.message}`);
      return [];
    } finally {
      this.loading = false;
    }
  }

  // Get makes list (with caching)
  getMakes() {
    return this.makes;
  }

  // Get models for current make
  getModels(make = null) {
    if (make) {
      return this.cache.models.get(make) || [];
    }
    return this.models;
  }

  // Check if loading is in progress
  isLoading() {
    return this.loading;
  }

  // Clear cache
  clearCache() {
    this.cache.makes = null;
    this.cache.models.clear();
  }

  // Cleanup
  destroy() {
    this.clearCache();
    this.makes = [];
    this.models = [];
  }
}
