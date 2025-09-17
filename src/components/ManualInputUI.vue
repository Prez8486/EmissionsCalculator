<template>
  <div class="manual-input-ui">
    <h2>Manual Trip Entry - {{ mode.toUpperCase() }}</h2>

    <!-- Car Fields -->
    <div v-if="mode === 'car'">
      <label>Make:</label>
      <select v-model="selectedMake" @change="onMakeChange">
        <option value="">Select Make</option>
        <option v-for="make in makes" :key="make" :value="make">{{ make }}</option>
      </select>

      <label>Model:</label>
      <select v-model="selectedModel">
        <option value="">Select Model</option>
        <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
      </select>
    </div>

    <!-- Flight Fields -->
    <div v-if="mode === 'flight'">
      <label>Departure Airport:</label>
      <input v-model="departureAirport" placeholder="Search airport..." @input="searchDeparture" />
      <ul v-if="departureResults.length">
        <li v-for="airport in departureResults" :key="airport.code" @click="selectDeparture(airport)">
          {{ airport.name }} ({{ airport.code }})
        </li>
      </ul>

      <label>Arrival Airport:</label>
      <input v-model="arrivalAirport" placeholder="Search airport..." @input="searchArrival" />
      <ul v-if="arrivalResults.length">
        <li v-for="airport in arrivalResults" :key="airport.code" @click="selectArrival(airport)">
          {{ airport.name }} ({{ airport.code }})
        </li>
      </ul>
    </div>

    <!-- Bus/Tram/Metro Fields -->
    <div v-if="['bus','tram','metro'].includes(mode)">
      <label>Route/Line:</label>
      <input v-model="route" placeholder="Enter route or line number" />

      <label>Distance (km):</label>
      <input v-model.number="distance" type="number" placeholder="Enter distance" />

      <label>Passengers:</label>
      <input v-model.number="passengers" type="number" placeholder="Optional" />
    </div>

    <button @click="submitTrip">Submit Trip</button>
  </div>
</template>

<script>
import { CarAPIPlugin } from "../plugins/carAPI.js";
import { FlightAPIPlugin } from "../plugins/flightAPI.js";

export default {
  name: "ManualInputUI",
  props: {
    mode: { type: String, required: true }
  },
  data() {
    return {
      // Car
      makes: [],
      models: [],
      selectedMake: "",
      selectedModel: "",

      // Flight
      departureAirport: "",
      arrivalAirport: "",
      departureResults: [],
      arrivalResults: [],

      // Bus/Tram/Metro
      route: "",
      distance: 0,
      passengers: 1,

      // API instances
      carPlugin: null,
      flightPlugin: null
    };
  },
  async mounted() {
    if (this.mode === "car") {
      this.carPlugin = new CarAPIPlugin();
      await this.carPlugin.init({
        onDataUpdate: ({ makes, models }) => {
          if (makes) this.makes = makes;
          if (models) this.models = models;
        },
        onError: (msg) => alert(msg)
      });
    } else if (this.mode === "flight") {
      this.flightPlugin = new FlightAPIPlugin();
      await this.flightPlugin.init({
        onError: (msg) => alert(msg)
      });
    }
  },
  methods: {
    // Car
    async onMakeChange() {
      if (!this.selectedMake) {
        this.models = [];
        return;
      }
      this.models = await this.carPlugin.fetchModels(this.selectedMake);
      this.selectedModel = "";
    },

    // Flight
    async searchDeparture() {
      if (!this.departureAirport) {
        this.departureResults = [];
        return;
      }
      this.departureResults = await this.flightPlugin.searchAirports(this.departureAirport);
    },
    selectDeparture(airport) {
      this.departureAirport = airport.name;
      this.departureResults = [];
    },

    async searchArrival() {
      if (!this.arrivalAirport) {
        this.arrivalResults = [];
        return;
      }
      this.arrivalResults = await this.flightPlugin.searchAirports(this.arrivalAirport);
    },
    selectArrival(airport) {
      this.arrivalAirport = airport.name;
      this.arrivalResults = [];
    },

    // Submit
    submitTrip() {
      const tripData = {
        mode: this.mode,
        car: this.mode === "car" ? { make: this.selectedMake, model: this.selectedModel } : null,
        flight: this.mode === "flight" ? { departure: this.departureAirport, arrival: this.arrivalAirport } : null,
        transit: ['bus','tram','metro'].includes(this.mode)
          ? { route: this.route, distance: this.distance, passengers: this.passengers }
          : null
      };
      this.$emit("tripComplete", tripData);
    }
  }
};
</script>
