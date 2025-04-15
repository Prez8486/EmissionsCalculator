<template>
  <div id="app">
    <h1>Carbon Footprint Calculator</h1>
    <CarbonCalculator />
  </div>
</template>

<script>
  import CarbonCalculator from './components/CarbonCalculator.vue'

  export default {
    name: 'App',
    components: {
      CarbonCalculator
    }
  }
</script>
