<template>
  <div class="container">
    <h2>Select Transport Mode</h2>
    <div class="transport-grid">
      <router-link class="btn" to="/form/car">
        <i class="fas fa-car icon"></i>
        <span class="desc">Add a car trip</span>
      </router-link>
      <router-link class="btn" to="/form/bus">
        <i class="fas fa-bus icon"></i>
        <span class="desc">Add a bus journey</span>
      </router-link>
      <router-link class="btn" to="/form/tram">
        <i class="fas fa-subway icon"></i>
        <span class="desc">Add a tram ride</span>
      </router-link>
      <router-link class="btn" to="/form/metro">
        <i class="fas fa-train icon"></i>
        <span class="desc">Add a metro/subway trip</span>
      </router-link>
      <router-link class="btn" to="/form/flight">
        <i class="fas fa-plane icon"></i>
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  justify-items: center;
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
  width: 180px;
  height: 140px;
  border-radius: 10px;
  font-size: 1.3em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}

.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #218838;
}

.icon {
  font-size: 2.4em;
  margin-bottom: 0.5rem;
}

.desc {
  font-size: 0.85em;
  max-width: 140px;
  color: #e2e2e2;
  line-height: 1.2;
}
</style>
