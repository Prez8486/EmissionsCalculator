<template>
  <div class="container">
    <h2>Select Transport Mode</h2>
    <div class="transport-grid">
      <router-link class="btn" to="/form/car">
        🚗 Car
        <span class="desc">Add a car trip</span>
      </router-link>
      <router-link class="btn" to="/form/bus">
        🚌 Bus
        <span class="desc">Add a bus journey</span>
      </router-link>
      <router-link class="btn" to="/form/tram">
        🚋 Tram
        <span class="desc">Add a tram ride</span>
      </router-link>
      <router-link class="btn" to="/form/metro">
        🚇 Metro
        <span class="desc">Add a metro/subway trip</span>
      </router-link>
      <router-link class="btn" to="/form/flight">
        ✈️ Flight
        <span class="desc">Log a flight</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
  .container {
    text-align: center;
    margin-top: 3rem;
  }

  .transport-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2em 1.5em;
    background: #28a745;
    color: white;
    text-decoration: none;
    width: 160px;
    height: 120px;
    border-radius: 10px;
    font-size: 1.6em;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

    .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      background: #218838;
    }

  .desc {
    font-size: 0.7em;
    margin-top: 0.5em;
    color: #e2e2e2;
  }
</style>
