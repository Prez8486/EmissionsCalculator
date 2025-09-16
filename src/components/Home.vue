<template>
  <div class="container dashboard-container">
    <h1 class="dashboard-title mb-4">Emissions Dashboard</h1>

    <!-- 2x2 Grid for Dashboard Cards -->
    <div class="row g-2">
      <div class="col-md-6" v-for="(card, i) in cards" :key="i">
        <div class="card dashboard-card h-100">
          <div class="card-body text-center">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text h4">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Trip Section -->
    <div v-if="lastTrip" class="last-trip mt-5">
      <h2 class="mb-3">Last Trip</h2>
      <div class="card last-trip-card">
        <div class="card-body">
          <p><strong>Date:</strong> {{ formatDate(lastTrip.date) }}</p>
          <p><strong>Mode:</strong> {{ lastTrip.transportMode || lastTrip.mode }}</p>
          <p><strong>Distance:</strong> {{ lastTrip.distance }} km</p>
          <p>
            <strong>Emissions:</strong>
            {{ (parseFloat(lastTrip.emissionKg || lastTrip.emission) / 1000).toFixed(4) }} tonnes
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      records: [],
    };
  },
  computed: {
    filteredRecords() {
      return this.records;
    },
    totalEmissions() {
      return this.filteredRecords.reduce((sum, r) => {
        const val = parseFloat(r.emissionKg || r.emission);
        return isNaN(val) ? sum : sum + val / 1000;
      }, 0);
    },
    mostCommonMode() {
      const counts = this.filteredRecords.reduce((acc, r) => {
        const mode = r.transportMode || r.mode;
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    },
    uniqueTripTypes() {
      return [...new Set(this.filteredRecords.map((r) => r.transportMode || r.mode))];
    },
    lastTrip() {
      return this.filteredRecords.length > 0
        ? [...this.filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        : null;
    },
    cards() {
      return [
        { title: "Total Emissions", value: this.totalEmissions.toFixed(2) + " t" },
        { title: "Most Common Mode", value: this.mostCommonMode },
        { title: "Unique Trip Types", value: this.uniqueTripTypes.length },
        { title: "Total Trips", value: this.filteredRecords.length },
      ];
    },
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date) ? "Invalid Date" : date.toLocaleDateString("en-GB");
    },
  },
  async mounted() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://emissionscalculatorbackend-3.onrender.com/api/emissions/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json();
      if (data.records) {
        this.records = data.records;
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  },
};
</script>

<style scoped>
.dashboard-container {
  margin-top: 2rem;
  max-width: 1000px;
}

.dashboard-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
}

.row.g-4 {
  row-gap: 1.5rem;
  column-gap: 1.5rem;
}

.dashboard-card {
  background-color: #f0f4f8;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.android-app .dashboard-card {
  background-color: #e0e7ff00;
  box-shadow: 0 4px 15px rgba(255, 8, 8, 0.836);
}

.dashboard-card:hover {
  transform: translateY(-3px);
}

.card-title {
  font-size: 1rem;
  color: #555;
}

.card-text {
  color: #000;
  font-weight: bold;
}

/* Last Trip Section */
.last-trip h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.last-trip-card {
  border-radius: 10px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.last-trip-card p {
  margin: 0.5rem 0;
}
  body.dark h2, th, td {
    color: #ffffff !important;
  }
</style>
