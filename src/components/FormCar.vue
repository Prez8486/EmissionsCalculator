<template>
  <div class="form-container">
    <h2>Car Emission Calculator</h2>
    <form>
      <label>Distance per Trip (km):</label>
      <input v-model.number="km" type="number" min="0" />

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

      <label>Car Brand:</label>
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
        km: 0,
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
        const record = {
          mode: 'Car',
          brand: this.brand,
          fuel: this.fuel,
          distance: this.km,
          trips: this.trips,
          extraLoad: this.extraLoadType,
          emission: this.emissionPerTrip.toFixed(3),
          timestamp: new Date().toISOString()
        };
        const records = JSON.parse(localStorage.getItem('emissionsRecords')) || [];
        records.push(record);
        localStorage.setItem('emissionsRecords', JSON.stringify(records));
        alert("Trip saved (per-trip emission stored)!");
        this.$router.push('/');
      }
    },
    mounted() {
      this.calculateEmission();
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
