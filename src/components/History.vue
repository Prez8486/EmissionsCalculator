<template>
  <div class="filters">
    <label>Filter by Mode:</label>
    <select v-model="filter.mode">
      <option value="">All</option>
      <option value="car">🚗 Car</option>
      <option value="bus">🚌 Bus</option>
      <option value="tram">🚋 Tram</option>
      <option value="metro">🚇 Metro</option>
      <option value="flight">✈ Flight</option>
    </select>

    <label>Start Date:</label>
    <input type="date" v-model="filter.startDate" />

    <label>End Date:</label>
    <input type="date" v-model="filter.endDate" />
  </div>

  <div class="history">
    <h2>Emission History</h2>
    <table v-if="records.length">
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
          <td>{{ r.date ? new Date(r.date).toLocaleString() : 'N/A' }}</td>
          <td>{{ r.transportMode }}</td>
          <td>
            <template v-if="r.transportMode.toLowerCase() === 'car'">
              Brand: {{ r.brand }}, Fuel: {{ r.fuel }}
              <br />
              {{ r.trips }} trips × {{ r.distanceKm }} km/trip
              <br />
              Load: {{ r.extraLoad || 'None' }}
            </template>
            <template v-else-if="r.transportMode.toLowerCase() === 'flight'">
              {{ r.flights }} flights × {{ r.hoursPerFlight }} hrs/flight
              <br />
              Airline: {{ r.airline || 'Generic' }}
              <br />
              Class: {{ r.flightClass || 'Economy' }}
            </template>
            <template v-else>
              {{ r.distanceKm }} km/week
            </template>
          </td>
          <td>{{ r.emissionKg ? (r.emissionKg / 1000).toFixed(3) : '0.000' }}</td>
          <td><button @click="openDetails(r)">View</button></td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:right;"><strong>Total Emissions</strong></td>
          <td><strong>{{ totalEmissions.toFixed(3) }}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <p v-else>No history yet.</p>

    <div v-if="selected" class="modal">
      <div class="modal-content">
        <span class="close" @click="selected = null">&times;</span>
        <h3>What If Analysis for {{ new Date(selected.date).toLocaleString() }}</h3>
        <p v-if="selected.transportMode.toLowerCase() === 'car'">
          What if the same distance was traveled by different car brands (fuel: {{ selected.fuel }})?
        </p>
        <p v-else-if="selected.transportMode.toLowerCase() === 'flight'">
          What if the same flight was taken with different airlines and seat classes?
        </p>
        <p v-else>
          What if the same distance was traveled using different public transport modes?
        </p>
        <BarChart v-if="chartData && chartData.labels && chartData.datasets" :data="JSON.parse(JSON.stringify(chartData))" />
      </div>
    </div>

    <div v-if="records.length" class="summary">
      <h3>Daily Emissions Overview</h3>
      <LineChart :data="lineChartData" />
    </div>
  </div>
</template>

<script>
  import { Bar, Line } from 'vue-chartjs';
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

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale
  );

  export default {
    components: { BarChart: Bar, LineChart: Line },
    data() {
      return {
        filter: {
          mode: '',
          startDate: '',
          endDate: ''
        },
        records: [],
        selected: null
      };
    },
    computed: {
      filteredRecords() {
        return this.records.filter(r => {
          const matchesMode = !this.filter.mode || r.transportMode.toLowerCase() === this.filter.mode;
          const date = new Date(r.date);
          const start = this.filter.startDate ? new Date(this.filter.startDate) : null;
          const end = this.filter.endDate ? new Date(this.filter.endDate) : null;
          const matchesStart = !start || date >= start;
          const matchesEnd = !end || date <= end;
          return matchesMode && matchesStart && matchesEnd;
        });
      },
      totalEmissions() {
        return this.filteredRecords.reduce((sum, r) => {
          const e = parseFloat(r.emissionKg) / 1000;
          return isNaN(e) ? sum : sum + e;
        }, 0);
      },
      lineChartData() {
        const emissionsByDay = {};
        this.filteredRecords.forEach(r => {
          const date = new Date(r.date);
          if (isNaN(date)) return;
          const day = date.toISOString().split('T')[0];
          emissionsByDay[day] = (emissionsByDay[day] || 0) + (parseFloat(r.emissionKg) / 1000);
        });
        const sortedDays = Object.keys(emissionsByDay).sort((a, b) => new Date(a) - new Date(b));
        return {
          labels: sortedDays.map(day => new Date(day)),
          datasets: [
            {
              label: 'Daily Emissions (tonnes)',
              data: sortedDays.map(day => emissionsByDay[day]),
              borderColor: '#FF6384',
              backgroundColor: '#FF6384',
              fill: false,
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7
            }
          ]
        };
      },
      chartData() {
        if (!this.selected) return null;
        const r = this.selected;
        const distance = r.distanceKm || 0;
        const fuel = "unleaded91";
        if (r.transportMode.toLowerCase() === 'car') {
          const fuelEfficiency = { toyota: 7.5, honda: 7.2, ford: 8.5 };
          const emissionFactors = {
            unleaded91: 2.31, unleaded98: 2.34, e10: 2.12, diesel: 2.68,
            hybrid: 2.31, lpg: 1.51, electric: 0
          };
          return {
            labels: ['Toyota', 'Honda', 'Ford'],
            datasets: [
              {
                label: 'Car Emissions (tonnes)',
                data: ['toyota', 'honda', 'ford'].map(b => ((fuelEfficiency[b] / 100) * distance * (emissionFactors[fuel] || 0)) / 1000),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726']
              }
            ]
          };
        } else if (r.transportMode.toLowerCase() === 'flight') {
          const hours = r.hoursPerFlight || 1;
          const flights = r.flights || 1;
          const emissionFactors = {
            emirates: 0.10,
            airindia: 0.11,
            qantas: 0.095,
            ryanair: 0.085
          };
          const classMultipliers = {
            economy: 1,
            business: 1.5,
            first: 2
          };
          const airlineNames = ['emirates', 'airindia', 'qantas', 'ryanair'];
          const seatClasses = ['economy', 'business', 'first'];
          return {
            labels: airlineNames.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
            datasets: seatClasses.map((cls, idx) => ({
              label: cls.charAt(0).toUpperCase() + cls.slice(1),
              data: airlineNames.map(a => flights * hours * (emissionFactors[a] || 0.09) * (classMultipliers[cls] || 1)),
              backgroundColor: ['#42A5F5', '#FFCE56', '#FF7043'][idx]
            }))
          };
        } else {
          const modes = ['Bus', 'Tram', 'Metro'];
          const factors = { Bus: 0.0001, Tram: 0.00007, Metro: 0.00006 };
          return {
            labels: modes,
            datasets: [
              {
                label: 'Weekly Emissions (tonnes)',
                data: modes.map(m => distance * factors[m]),
                backgroundColor: '#66BB6A'
              }
            ]
          };
        }
      }
    },
    methods: {
      openDetails(record) {
        this.selected = record;
      },
      async fetchRecords() {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/emissions/history', {
            headers: {
              Authorization: `Bearer ${ token }`
            }
          });
      const data = await res.json();
      if(data.records) {
    this.records = data.records;
  }
        } catch (err) {
    console.error('Failed to fetch records:', err);
  }
      }
    },
  mounted() {
    this.fetchRecords();
  }
  };
</script>


<style scoped>
  .filters {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

    .filters label {
      font-weight: bold;
    }

  .history {
    max-width: 1000px;
    margin: 2rem auto;
    background: #fff;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 1rem;
    text-align: left;
  }

  th {
    background: #f0f0f0;
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 700px;
    width: 100%;
  }

  .close {
    float: right;
    font-size: 1.5rem;
    cursor: pointer;
  }
</style>
