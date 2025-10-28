<template>
  <div class="destination-search-bar">
    <div class="search-container">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showHint = false"
        placeholder="🔍 Search destination..."
        class="search-input"
        :disabled="selectedDestination !== null"
      />

      <button
        v-if="searchQuery || selectedDestination"
        @click="clearDestination"
        class="clear-btn"
      >
        ✕
      </button>
    </div>

    <!-- Search Results Dropdown -->
    <ul v-if="searchResults.length > 0" class="search-results">
      <li
        v-for="result in searchResults"
        :key="result.place_id"
        @click="selectResult(result)"
        class="result-item"
      >
        <span class="result-icon">📍</span>
        <span class="result-text">{{ result.display_name }}</span>
      </li>
    </ul>

    <!-- Selected Destination Display -->
    <div v-if="selectedDestination" class="selected-destination">
      <span class="destination-icon">📍</span>
      <span class="destination-text">{{ selectedDestination.address }}</span>
    </div>

    <!-- Hint -->
    <div v-if="showHint && !selectedDestination" class="hint">
      Or tap map to select destination
    </div>

    <!-- Loading indicator -->
    <div v-if="searching" class="searching-indicator">
      Searching...
    </div>
  </div>
</template>

<script>
export default {
  name: 'DestinationSearchBar',

  props: {
    currentLocation: {
      type: Object,
      default: null
    }
  },

  emits: ['destination-selected', 'destination-cleared'],

  data() {
    return {
      searchQuery: '',
      searchResults: [],
      selectedDestination: null,
      searching: false,
      searchTimeout: null,
      showHint: true
    };
  },

  methods: {
    handleSearch() {
      // Clear previous timeout
      clearTimeout(this.searchTimeout);

      // Don't search if query is too short
      if (this.searchQuery.length < 3) {
        this.searchResults = [];
        return;
      }

      // Debounce search
      this.searchTimeout = setTimeout(() => {
        this.performSearch();
      }, 300);
    },

    async performSearch() {
      this.searching = true;

      try {
        // Use Nominatim (OpenStreetMap) geocoding API
        const query = encodeURIComponent(this.searchQuery);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'EmissionsCalculatorApp/1.0' // Required by Nominatim
          }
        });

        if (!response.ok) throw new Error('Search failed');

        const results = await response.json();
        this.searchResults = results;

      } catch (error) {
        console.error('Search error:', error);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    selectResult(result) {
      this.selectedDestination = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        address: result.display_name
      };

      // Clear search state
      this.searchResults = [];
      this.searchQuery = '';

      // Emit event to parent
      this.$emit('destination-selected', this.selectedDestination);
    },

    clearDestination() {
      this.searchQuery = '';
      this.searchResults = [];
      this.selectedDestination = null;
      this.showHint = true;

      this.$emit('destination-cleared');
    }
  }
};
</script>

<style scoped>
.destination-search-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 1000;
}

.search-container {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: 12px 15px;
  border: none;
  font-size: 14px;
  outline: none;
}

.search-input:disabled {
  background: #f8f9fa;
  color: #666;
}

.clear-btn {
  padding: 0 15px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #333;
}

.search-results {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8f9fa;
}

.result-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.result-text {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.selected-destination {
  margin-top: 8px;
  padding: 10px 15px;
  background: #e3f2fd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.destination-icon {
  font-size: 16px;
}

.destination-text {
  font-size: 13px;
  color: #1976d2;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.searching-indicator {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 6px;
  font-size: 12px;
  color: #007bff;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
</style>
