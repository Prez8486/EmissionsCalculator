<template>
  <div class="form-container">
    <h2>Tram Emission Calculator</h2>
    <form @submit.prevent="calculateEmission">
      <label>Tram Distance Travelled (km):</label>
      <input v-model.number="km" type="number" min="0" />
      <button type="submit" :disabled="loading">
        {{ loading ? "Calculating..." : "Calculate" }}
      </button>
    </form>

    <div v-if="emission !== null" class="result">
      <h3>Emissions Summary</h3>
      <p><strong>This Trip:</strong> {{ emission.toFixed(3) }} tonnes CO₂</p>
      <button @click="save">Save to History</button>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        km: 0,
        emission: null,
        loading: false
      };
    },
    methods: {
      async calculateEmission() {
        if (!this.km) {
          alert("Please enter distance.");
          return;
        }
        try {
          this.loading = true;
          const res = await fetch("https://emissionscalculatorbackend.onrender.com/api/emissions/tram/emissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distanceKm: this.km })
          });
          const data = await res.json();
          this.emission = (data.emissionKg || 0) / 1000; // backend gives kg → convert to tonnes
        } catch (err) {
          console.error(err);
          alert("Error calculating tram emissions");
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
            transportMode: "tram",
            distanceKm: this.km,
            emissionKg: this.emission * 1000 // already calculated, send to backend
          };
          const res = await fetch("https://emissionscalculatorbackend.onrender.com/api/emissions/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.message) {
            alert("Tram trip saved to backend!");
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
  body.dark label {
    color: #000000 !important;
  }
</style>
