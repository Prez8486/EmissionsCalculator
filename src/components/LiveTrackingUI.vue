<template>
  <div class="live-tracking-ui">
    <h2>Live Trip Tracking</h2>

    <div id="map" class="map-view">
      <!-- Map placeholder -->
      <p>Map will render here</p>
    </div>

    <div class="controls">
      <button @click="startTrip" :disabled="tracking">Start Trip</button>
      <button @click="endTrip" :disabled="!tracking">End Trip</button>
    </div>

    <!-- Popup after trip ends -->
    <TripPopup
      v-if="showPopup"
      :summary="summary"
      :route="route"
      @close="showPopup = false"
    />
  </div>
</template>

<script>
import TripPopup from "./TripPopup.vue";

export default {
  name: "LiveTrackingUI",
  components: { TripPopup },
  props: {
    mode: { type: String, required: true },
  },
  data() {
    return {
      tracking: false,
      route: [],
      summary: null,
      showPopup: false,
    };
  },
  methods: {
    startTrip() {
      this.tracking = true;
      this.route = [];
      console.log("Trip started");
      // TODO: integrate GPS listener here
    },
    endTrip() {
      this.tracking = false;
      // TODO: compute distance + emissions via BaseTrip
      this.summary = {
        mode: this.mode,
        emissions: Math.random() * 80,
        distance: 12.3,
      };
      this.showPopup = true;
    },
  },
};
</script>

<style scoped>
.map-view {
  height: 300px;
  background: #e0e0e0;
  margin-bottom: 1rem;
}
.controls {
  display: flex;
  gap: 1rem;
}
</style>
