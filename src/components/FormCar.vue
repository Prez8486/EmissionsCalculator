<!--<template>
  <div class="form-container">
    <h2>Car Emission Calculator</h2>
    <form>
      <label>Distance per Trip (km):</label>
      <input v-model.number="km" type="number" min="0" readonly />

      <label>Trips per Week:</label>
      <input v-model.number="trips" type="number" min="0" />

      <label>Extra Load:</label>
      <select v-model="extraLoadType">
        <option value="none">None</option>
        <option value="caravan">Caravan</option>
        <option value="boat">Boat</option>
        <option value="trailer-light">Trailer (Light)</option>
        <option value="trailer-medium">Trailer (Medium)</option>
        <option value="trailer-heavy">Trailer (Heavy)</option>
      </select>

      <label>Car Make:</label>
      <select v-model="brand">
        <option value="toyota">Toyota</option>
        <option value="honda">Honda</option>
        <option value="ford">Ford</option>
        <option value="tesla">Tesla (Electric)</option>
      </select>

      <label>Fuel Type:</label>
      <select v-model="fuel" :disabled="brand === 'tesla'">
        <option v-for="(label, type) in fuelNames" :key="type" :value="type">
          {{ label }}
        </option>
      </select>
    </form>

    <div v-if="emissionPerTrip !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Per Trip:</strong> {{ emissionPerTrip.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Week:</strong> {{ emissionPerWeek.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Year:</strong> {{ emissionPerYear.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        km: parseFloat(localStorage.getItem('carTripDistance')) || 0,
        trips: 1,
        brand: 'toyota',
        fuel: 'unleaded91',
        extraLoadType: 'none',
        fuelNames: {
          unleaded91: 'Unleaded 91',
          unleaded98: 'Unleaded 98',
          e10: 'E10',
          diesel: 'Diesel',
          lpg: 'LPG',
          hybrid: 'Hybrid'
        },
        emissionPerTrip: null,
        emissionPerWeek: null,
        emissionPerYear: null
      };
    },
    watch: {
      brand(newVal) {
        if (newVal === 'tesla') {
          this.fuel = 'electric';
        } else if (this.fuel === 'electric') {
          this.fuel = 'unleaded91';
        }
        this.calculateEmission();
      },
      fuel: 'calculateEmission',
      km: 'calculateEmission',
      trips: 'calculateEmission',
      extraLoadType: 'calculateEmission'
    },
    methods: {
      calculateEmission() {
        const emissionFactors = {
          unleaded91: 2.31,
          unleaded98: 2.34,
          e10: 2.12,
          diesel: 2.68,
          hybrid: 2.31,
          lpg: 1.51,
          electric: 0
        };

        const fuelEfficiency = {
          toyota: { unleaded91: 7.5, unleaded98: 7.3, e10: 7.6, diesel: 6.2, lpg: 7.1, hybrid: 4.0 },
          honda: { unleaded91: 7.2, unleaded98: 7.0, e10: 7.4, diesel: 6.0, lpg: 7.0, hybrid: 4.2 },
          ford: { unleaded91: 8.5, unleaded98: 8.3, e10: 8.6, diesel: 7.0, lpg: 7.8, hybrid: 4.5 },
          tesla: { electric: 0 }
        };

        const loadFactors = {
          none: 0,
          caravan: 10,
          boat: 15,
          'trailer-light': 5,
          'trailer-medium': 10,
          'trailer-heavy': 20
        };

        const consumption = fuelEfficiency[this.brand][this.fuel] || 0;
        const factor = emissionFactors[this.fuel] || 0;
        const loadIncrease = loadFactors[this.extraLoadType] || 0;
        const adjustedConsumption = consumption * (1 + loadIncrease / 100);

        const emissionPerTrip = (adjustedConsumption / 100) * this.km * factor / 1000;
        const emissionPerWeek = emissionPerTrip * this.trips;
        const emissionPerYear = emissionPerWeek * 52;

        this.emissionPerTrip = emissionPerTrip;
        this.emissionPerWeek = emissionPerWeek;
        this.emissionPerYear = emissionPerYear;
      },
      save() {
        const token = localStorage.getItem('token');
        if (!token) {
          alert("You must be logged in to save emissions.");
          this.$router.push('/login');
          return;
        }

        const payload = {
          transportMode: "car",
          distanceKm: this.km,
          brand: this.brand,
          fuel: this.fuel,
          extraLoad: this.extraLoadType,
          trips: this.trips
        };

        fetch("https://emissionscalculatorbackend-1.onrender.com/api/emissions/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ token }`
    },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
      .then(data => {
        if (data.message) {
          alert("Trip saved to backend!");
          this.$router.push('/home');
        } else {
          alert("Failed to save: " + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error saving emission log.");
      });
  }


    },
    mounted() {
      this.calculateEmission();
      localStorage.removeItem('carTripDistance');
    }
  };
</script>

<style scoped>
  .form-container {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 10px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-top: 1rem;
  }

  input, select {
    padding: 0.5rem;
    margin-top: 0.3rem;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
  }

  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e6f5ff;
    border: 1px solid #007acc;
    border-radius: 8px;
    color: #00457c;
  }
</style>
-->
<template>
  <div class="form-container">
    <h2>Car Emission Calculator</h2>
    <form @submit.prevent="calculateEmission">
      <!-- Distance -->
      <label>Distance per Trip (km):</label>
      <input v-model.number="km" type="number" min="0" />

      <!-- Trips -->
      <label>Trips per Week:</label>
      <input v-model.number="trips" type="number" min="0" />

      <!-- Extra Load -->
      <label>Extra Load:</label>
      <select v-model="extraLoadType">
        <option value="none">None</option>
        <option value="caravan">Caravan</option>
        <option value="boat">Boat</option>
        <option value="trailer-light">Trailer (Light)</option>
        <option value="trailer-medium">Trailer (Medium)</option>
        <option value="trailer-heavy">Trailer (Heavy)</option>
      </select>

      <!-- Car Make -->
      <label>Car Make:</label>
      <select v-model="selectedMake" @change="fetchModels">
        <option disabled value="">Select Make</option>
        <option v-for="make in makes || []" :key="make.id" :value="make.id">
          {{ make.data.attributes.name }}
        </option>
      </select>

      <!-- Car Model -->
      <label>Car Model:</label>
      <select v-model="selectedModel">
        <option disabled value="">Select Model</option>
        <option v-for="model in models || []" :key="model.id" :value="model.id">
          {{ model.data.attributes.name }}
        </option>
      </select>

      <!-- Calculate Button -->
      <button type="submit" :disabled="loading">
        {{ loading ? "Calculating..." : "Calculate" }}
      </button>
    </form>

    <!-- Result -->
    <div v-if="emissionPerTrip !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>Per Trip:</strong> {{ emissionPerTrip.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Week:</strong> {{ emissionPerWeek.toFixed(3) }} tonnes CO₂</p>
      <p><strong>Per Year:</strong> {{ emissionPerYear.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        km: parseFloat(localStorage.getItem("carTripDistance")) || 0,
        trips: 1,
        extraLoadType: "none",
        makes: [],
        models: [],
        selectedMake: "",
        selectedModel: "",
        emissionPerTrip: null,
        emissionPerWeek: null,
        emissionPerYear: null,
        loading: false
      };
    },
    async mounted() {
      localStorage.removeItem("carTripDistance");
      await this.fetchMakes();
    },
    methods: {
      async fetchMakes() {
        try {
          const res = await fetch("https://emissionscalculatorbackend-1.onrender.com/api/emissions/car/makes");
          this.makes = await res.json();
        } catch (err) {
          console.error(err);
          alert("Failed to load car makes");
        }
      },
      async fetchModels() {
        try {
          const res = await fetch(`https://emissionscalculatorbackend-1.onrender.com/api/emissions/car/models/${this.selectedMake}`);
          this.models = await res.json();
        } catch (err) {
          console.error(err);
          alert("Failed to load car models");
        }
      },
      async calculateEmission() {
        if (!this.selectedModel || !this.km) {
          alert("Please enter distance and select a model");
          return;
        }
        try {
          this.loading = true;
          const res = await fetch("https://emissionscalculatorbackend-1.onrender.com/api/emissions/car/emissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleModelId: this.selectedModel,
              distanceKm: this.km
            })
          });
          const data = await res.json();
          const emissionKg = data.data.attributes.carbon_kg;

          // Convert to tonnes & calculate totals
          this.emissionPerTrip = emissionKg / 1000;
          this.emissionPerWeek = this.emissionPerTrip * this.trips;
          this.emissionPerYear = this.emissionPerWeek * 52;
        } catch (err) {
          console.error(err);
          alert("Error calculating emissions");
        } finally {
          this.loading = false;
        }
      },
      async save() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("You must be logged in to save emissions.");
          this.$router.push("/login");
          return;
        }

        try {
          const payload = {
            transportMode: "car",
            vehicleModelId: this.selectedModel,
            distanceKm: this.km,
            trips: this.trips,
            extraLoad: this.extraLoadType
          };

          const res = await fetch("https://emissionscalculatorbackend-1.onrender.com/api/emissions/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.message) {
            alert("Trip saved to backend!");
            this.$router.push("/home");
          } else {
            alert("Failed to save: " + data.error);
          }
        } catch (err) {
          console.error(err);
          alert("Error saving emission log.");
        }
      }
    }
  };
</script>

<style scoped>
  .form-container {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 10px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-top: 1rem;
  }

  input,
  select {
    padding: 0.5rem;
    margin-top: 0.3rem;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
  }

  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e6f5ff;
    border: 1px solid #007acc;
    border-radius: 8px;
    color: #00457c;
  }
</style>
