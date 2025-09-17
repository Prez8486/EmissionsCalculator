<template>
  <div>
    <h1>Trips Demo</h1>

    <h2>Manual Input Example</h2>
    <ManualInputUI mode="car" />

    <h2>Live Tracking Example</h2>
    <LiveTrackingUI mode="bus" />
  </div>
</template>

<script>
import ManualInputUI from "@/components/ManualInputUI.vue";
import LiveTrackingUI from "@/components/LiveTrackingUI.vue";

export default {
  name: "TripsPage",
  components: { ManualInputUI, LiveTrackingUI }
};
</script>
