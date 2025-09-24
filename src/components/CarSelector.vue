<template>
  <section class="current-car">
    <h2>Select Your Current Car</h2>
    <form @submit.prevent="saveCurrentCar">
      <!-- Car Make -->
      <label>Car Make:</label>
      <select v-model="selectedMake" @change="fetchModels">
        <option disabled value="">Select Make</option>
        <option v-for="make in makes || []" :key="make.make" :value="make.make">
          {{ make.make }}
        </option>
      </select>

      <label>Car Model:</label>
      <select v-model="selectedModel">
        <option disabled value="">Select Model</option>

        <option v-for="model in models || []" :key="model.model" :value="model.model">
          {{ model.model }}

        </option>
      </select>

      <button type="submit">Save Current Car</button>
    </form>

    <!-- Confirmation -->
    <div v-if="currentCar" class="current-car-display">
      <p><strong>Selected Car:</strong> {{ currentCar.make }} {{ currentCar.model }}</p>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      makes: [],
      models: [],
      selectedMake: "",
      selectedModel: "",
      currentCar: null
    };
  },
  async mounted() {
    await this.fetchMakes();
  },
    async fetchMakes() {
      try {
        const res = await fetch("https://emissionscalculatorbackend.duckdns.org/api/emissions/car/makes");
        const result = await res.json();
        this.makes = result.data || [];
      } catch (err) {
        console.error(err);
        alert("Failed to load car makes");
      }
    },
    async fetchModels() {
      try {
        const res = await fetch(`https://emissionscalculatorbackend.duckdns.org/api/emissions/car/models/${this.selectedMake}`);
        const result = await res.json();
        this.models = result.data || [];
      } catch (err) {
        console.error(err);
        alert("Failed to load car models");
      }
    },
    saveCurrentCar() {
      if (!this.selectedMake || !this.selectedModel) {
        alert("Please select both make and model");
        return;
      }
      this.currentCar = {
        make: this.selectedMake,
        model: this.selectedModel
      };

      // Optionally save to localStorage so it persists
      localStorage.setItem("currentCar", JSON.stringify(this.currentCar));
    }
  }
};
</script>

<style scoped>
.current-car {
  max-width: 600px;
  margin: 1rem auto;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 10px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  font-weight: bold;
}

select, button {
  padding: 0.5rem;
  border-radius: 5px;
}

button {
  background: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
}

.current-car-display {
  margin-top: 1rem;
  background: #e8f6ff;
  padding: 1rem;
  border: 1px solid #007acc;
  border-radius: 8px;
}
</style>
