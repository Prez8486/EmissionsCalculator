<template>
  <div class="trip-popup">
    <div class="popup-content">
      <h3>Trip Summary</h3>
      <p><strong>Mode:</strong> {{ summary.mode }}</p>
      <p><strong>Distance:</strong> {{ summary.distance }} km</p>
      <p><strong>Emissions:</strong> {{ summary.emissions.toFixed(2) }} kg CO₂</p>

      <div class="map-placeholder">
        <p>Route Map Preview</p>
        <!-- Later you can replace with Leaflet/Mapbox -->
      </div>

      <button @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "TripPopup",
  props: {
    summary: { type: Object, required: true },
    route: { type: Array, default: () => [] }
  }
};
</script>

<style scoped>
.trip-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.popup-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 300px;
  text-align: center;
}
.map-placeholder {
  height: 150px;
  background: #e0e0e0;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
