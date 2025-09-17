<template>
  <div class="emissions-summary">
    <h3>Emissions Summary</h3>
    <p><strong>Mode:</strong> {{ emissions.mode }}</p>
    <p><strong>Distance:</strong> {{ emissions.distance }} km</p>
    <p><strong>Emissions:</strong> {{ emissions.emissions.toFixed(2) }} kg CO₂</p>

    <button @click="$emit('save')">Save Trip</button>
  </div>
</template>

<script>
export default {
  name: "EmissionsSummary",
  props: {
    emissions: { type: Object, required: true }
  }
};
</script>

<style scoped>
.emissions-summary {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-top: 1rem;
  background: #fafafa;
}
</style>
