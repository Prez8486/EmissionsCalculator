<template>
  <div class="history-page">
    <!-- Header -->
    <div class="page-header">
      <h2>📊 Emissions History</h2>
      <p class="subtitle">Track your carbon footprint over time</p>
    </div>

    <!-- Monthly Chart -->
    <div class="chart-section">
      <h3 class="monthly-title">Monthly Emissions Overview</h3>
      <div class="chart-container fixed-chart">
        <LineChart v-if="lineChartData" :chart-data="lineChartData" :options="lineChartOptions" />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <h3>Filter Your Data</h3>
      <div class="filters">
        <div class="filter-group">
          <label>Transport Mode:</label>
          <select v-model="filter.mode">
            <option value="">All Modes</option>
            <option value="car">🚗 Car</option>
            <option value="bus">🚌 Bus</option>
            <option value="tram">🚋 Tram</option>
            <option value="metro">🚇 Metro</option>
            <option value="flight">✈ Flight</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Start Date:</label>
          <input type="date" v-model="filter.startDate" />
        </div>
        <div class="filter-group">
          <label>End Date:</label>
          <input type="date" v-model="filter.endDate" />
        </div>
        <button class="clear-btn" @click="clearFilters">Clear Filters</button>
      </div>
    </div>

    <!-- Trip History Table -->
    <div class="table-section">
      <div class="table-header">
        <h3>Trip History</h3>
        <div class="total-emissions">
          <span class="total-label">Total Filtered Emissions:</span>
          <span class="total-value">{{ totalEmissions.toFixed(3) }} tonnes</span>
        </div>
      </div>

      <table v-if="filteredRecords.length">
        <thead>
          <tr>
            <th>Date</th>
            <th>Mode</th>
            <th>Details</th>
            <th>Emissions (tonnes)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in filteredRecords" :key="i">
            <td>{{ new Date(r.date).toLocaleDateString() }}</td>
            <td>
              <span class="mode-badge" :class="r.transportMode.toLowerCase()">
                {{ getIcon(r.transportMode) }} {{ r.transportMode }}
              </span>
            </td>
            <td>
              <template v-if="r.transportMode.toLowerCase() === 'car'">
                <div><strong>Brand:</strong> {{ r.brand }}</div>
                <div><strong>Fuel:</strong> {{ r.fuel }}</div>
                <div><strong>Distance:</strong> {{ r.trips || 1 }} trips × {{ r.distanceKm }} km</div>
                <div v-if="r.extraLoad"><strong>Load:</strong> {{ r.extraLoad }}</div>
              </template>
              <template v-else-if="r.transportMode.toLowerCase() === 'flight'">
                <div><strong>Flights:</strong> {{ r.flights }} × {{ r.hoursPerFlight }} hrs</div>
                <div><strong>Airline:</strong> {{ r.airline }}</div>
                <div><strong>Class:</strong> {{ r.flightClass || 'Economy' }}</div>
              </template>
              <template v-else>
                <div><strong>Distance:</strong> {{ r.distanceKm }} km</div>
              </template>
            </td>
            <td class="emissions-cell">
              <span class="emissions-value">{{ (r.emissionKg / 1000).toFixed(3) }}</span>
            </td>
            <td>
              <button @click="selected = r" class="view-btn">
                👁 View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-trips">No history data found.</div>
    </div>

    <!-- Modal -->
    <div v-if="selected" class="modal" @click="selected = null">
      <div class="modal-content" @click.stop>
        <span class="close" @click="selected = null">&times;</span>
        <h3>Trip Route: {{ new Date(selected.date).toLocaleDateString() }}</h3>
        <div id="tripMap" class="map"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import L from "leaflet";
  import { Bar, Line } from 'vue-chartjs';
  import { API_BASE } from '@/config/apiConfig';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, TimeScale);

  export default {
    components: { BarChart: Bar, LineChart: Line },
    data() {
      return {
        filter: { mode: '', startDate: '', endDate: '' },
        records: [],
        selected: null,
        loading: true,
        error: null,
        map: null
      };
    },

    watch: {
      selected() {
        if (this.selected) {
          this.$nextTick(() => {
            if (this.map) {
              this.map.remove();
              this.map = null;
            }

            if (!this.selected.path || this.selected.path.length == 0) {
              alert("There is no route available for this trip.")
              this.selected = null;
              return;
            }

            this.map = L.map("tripMap").setView(this.selected.path[0], 13);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap"
            }).addTo(this.map);
            L.polyline(this.selected.path, { color: "red" }).addTo(this.map);
          })
        }
      }
    },

    computed: {
      filteredRecords() {
        return this.records.filter(r => {
          const matches = !this.filter.mode || r.transportMode.toLowerCase() === this.filter.mode;
          const date = new Date(r.date);
          const start = this.filter.startDate ? new Date(this.filter.startDate) : null;
          const end = this.filter.endDate ? new Date(this.filter.endDate) : null;
          return matches && (!start || date >= start) && (!end || date <= end);
        });
      },
      totalEmissions() {
        return this.filteredRecords.reduce((sum, r) => sum + (parseFloat(r.emissionKg) / 1000 || 0), 0);
      },
      lineChartData() {
        if (!this.filteredRecords.length) return null;

        const emissionsByDay = {};
        this.filteredRecords.forEach(r => {
          const d = new Date(r.date);
          const day = d.toISOString().split('T')[0];
          emissionsByDay[day] = (emissionsByDay[day] || 0) + (parseFloat(r.emissionKg) / 1000);
        });
        const sorted = Object.keys(emissionsByDay).sort();
        if (!sorted.length) return null;

        return {
          labels: sorted.map(d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
          datasets: [{
            label: 'Daily Emissions (tonnes)',
            data: sorted.map(d => emissionsByDay[d].toFixed(4)),
            borderColor: '#FF6384', backgroundColor: '#FF6384', tension: 0.3, pointRadius: 5
          }]
        };
      },
      lineChartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Emissions (tonnes)' }
          }
        },
        plugins: { legend: { display: true }, title: { display: false } }
      },
      // chartData() {
      //   if (!this.selected) return null;
      //   const r = this.selected;

      //   // 🚗 Car
      //   if (r.transportMode.toLowerCase() === 'car') {
      //     const distance = r.distanceKm || 0;
      //     const efficiency = { Toyota: 7.5, Honda: 7.2, Ford: 8.5 };
      //     const factors = { unleaded91: 2.31 };
      //     return {
      //       labels: Object.keys(efficiency),
      //       datasets: [{
      //         label: 'Car Emissions (tonnes)',
      //         data: Object.entries(efficiency).map(([k, v]) =>
      //           ((v / 100) * distance * factors.unleaded91 / 1000).toFixed(4)
      //         ),
      //         backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726']
      //       }]
      //     };
      //   }

      //   // ✈ Flight
      //   if (r.transportMode.toLowerCase() === 'flight') {
      //     const flights = r.flights || 1;
      //     const hours = r.hoursPerFlight || 1;
      //     const airlineFactors = {
      //       Generic: 0.09, Emirates: 0.10, AirIndia: 0.11, Qantas: 0.095, Ryanair: 0.085
      //     };
      //     const multiplier = { economy: 1, premium: 1.2, business: 1.5, first: 2 };
      //     const currentClass = (r.flightClass || 'economy').toLowerCase();
      //     return {
      //       labels: Object.keys(airlineFactors),
      //       datasets: [{
      //         label: 'Flight Emissions (tonnes)',
      //         data: Object.entries(airlineFactors).map(([airline, factor]) =>
      //           (flights * hours * factor * (multiplier[currentClass] || 1)).toFixed(4)
      //         ),
      //         backgroundColor: ['#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#E53935']
      //       }]
      //     };
      //   }

      //   // 🚌 Bus
      //   if (r.transportMode.toLowerCase() === 'bus') {
      //     const distance = r.distanceKm || 0;
      //     const busTypes = { CityBus: 0.0001, Coach: 0.00008 };
      //     return {
      //       labels: Object.keys(busTypes),
      //       datasets: [{
      //         label: 'Bus Emissions (tonnes)',
      //         data: Object.values(busTypes).map(f => (distance * f).toFixed(4)),
      //         backgroundColor: ['#29B6F6', '#8BC34A']
      //       }]
      //     };
      //   }

      //   // 🚋 Tram
      //   if (r.transportMode.toLowerCase() === 'tram') {
      //     const distance = r.distanceKm || 0;
      //     const tramTypes = { LightRail: 0.00007, HeavyTram: 0.00009 };
      //     return {
      //       labels: Object.keys(tramTypes),
      //       datasets: [{
      //         label: 'Tram Emissions (tonnes)',
      //         data: Object.values(tramTypes).map(f => (distance * f).toFixed(4)),
      //         backgroundColor: ['#FFCA28', '#7E57C2']
      //       }]
      //     };
      //   }

      //   // 🚇 Metro
      //   if (r.transportMode.toLowerCase() === 'metro') {
      //     const distance = r.distanceKm || 0;
      //     const metroTypes = { Metro: 0.00006, SuburbanRail: 0.00008 };
      //     return {
      //       labels: Object.keys(metroTypes),
      //       datasets: [{
      //         label: 'Metro Emissions (tonnes)',
      //         data: Object.values(metroTypes).map(f => (distance * f).toFixed(4)),
      //         backgroundColor: ['#26A69A', '#AB47BC']
      //       }]
      //     };
      //   }

      //   return null;
      // }
    },
    methods: {
      getIcon(mode) {
        return { car: '🚗', bus: '🚌', tram: '🚋', metro: '🚇', flight: '✈' }[mode.toLowerCase()] || '❓';
      },
      clearFilters() {
        this.filter = { mode: '', startDate: '', endDate: '' };
      },
      async fetchRecords() {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/emissions/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              this.$router.push({ path: '/login', query: { redirect: '/history' } });
              return;
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          const data = await res.json();
          this.records = data.records || [];
        } catch (err) {
          console.error('Failed to fetch records:', err);
          this.error = err.message;
          this.records = [];
        } finally {
          this.loading = false;
        }
      }
    },
    async mounted() {
      await this.fetchRecords();
    }
  };
</script>

<style scoped>
  .history-page {
    padding: 1rem;
    max-width: 1200px;
    margin: auto;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .subtitle {
    color: #6b7280;
    font-size: 0.95rem;
  }

  .chart-section {
    margin-bottom: 2rem;
  }

  .filters-section,
  .table-section {
    background: #ffffff;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .chart-container.fixed-chart {
    min-height: 400px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    flex: 1 1 200px;
  }

    .filter-group label {
      font-weight: 600;
      margin-bottom: 0.3rem;
    }

    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 6px;
    }

  .clear-btn {
    background: #6b7280;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-top: auto;
  }

    .clear-btn:hover {
      background: #4b5563;
    }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .total-emissions {
    background: #eff6ff;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #1d4ed8;
    font-weight: bold;
  }

  .table-section table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f9fafb;
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
  }

  .mode-badge {
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
  }

    .mode-badge.car {
      background: #dbeafe;
      color: #1e40af;
    }

    .mode-badge.bus {
      background: #dcfce7;
      color: #166534;
    }

    .mode-badge.tram {
      background: #fef3c7;
      color: #92400e;
    }

    .mode-badge.metro {
      background: #ede9fe;
      color: #7c3aed;
    }

    .mode-badge.flight {
      background: #fee2e2;
      color: #b91c1c;
    }

  .emissions-cell {
    font-weight: bold;
    color: #ef4444;
  }

  .view-btn {
    background: #007bff;
    color: white;
    padding: 0.5rem 0.9rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
  }

    .view-btn:hover {
      background: #0056b3;
    }

  .no-trips {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal-content {
    background: white;
    height: 90vh;
    padding: 2rem;
    border-radius: 8px;
    max-width: 700px;
    width: 90%;
    position: relative;
  }

  .close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
    }

    .table-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
  }

  #map {
    height: 400px !important;
    width: 100% !important;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .map {
    height: 100%;
    width: 100%;
    border-radius: 8px;
  }

  body.dark h2 {
    color: #ffffff !important;
  }

  body.dark .monthly-title {
    color: #ffffff !important;
  }
</style>
