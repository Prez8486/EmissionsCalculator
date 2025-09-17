// flightApi.js
export class FlightAPIPlugin {
  constructor() {
    this.airports = [];
    this.loading = false;
    this.cache = new Map(); // cache search queries

    // Callbacks
    this.onAirportsLoaded = null;
    this.onError = null;
  }

  async init(tripInstance) {
    this.trip = tripInstance;

    this.onAirportsLoaded = (airports, query) => {
      this.trip.onDataUpdate({ airports, airportsLoaded: true, lastQuery: query });
    };

    this.onError = (error) => {
      this.trip.onError('Flight API Error', error);
    };
  }

  // Search airports by query (IATA code, city, etc.)
  async searchAirports(query) {
    if (!query || query.length < 2) {
      this.airports = [];
      this.onAirportsLoaded([], query);
      return [];
    }

    // Check cache
    if (this.cache.has(query)) {
      this.airports = this.cache.get(query);
      this.onAirportsLoaded(this.airports, query);
      return this.airports;
    }

    try {
      this.loading = true;

      const response = await fetch(
        `http://136.186.108.171/api/emissions/flight/airports?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.airports = result.data || [];

      // Cache the result
      this.cache.set(query, this.airports);

      this.onAirportsLoaded(this.airports, query);
      return this.airports;

    } catch (error) {
      console.error('Failed to search airports:', error);
      this.onError(`Failed to search airports: ${error.message}`);
      return [];
    } finally {
      this.loading = false;
    }
  }

  getAirports(query = null) {
    if (query) {
      return this.cache.get(query) || [];
    }
    return this.airports;
  }
}
