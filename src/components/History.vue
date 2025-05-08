<template>
  <div class="filters">
    <label>Filter by Mode:</label>
    <select v-model="filter.mode">
      <option value="">All</option>
      <option value="Car">🚗 Car</option>
      <option value="Bus">🚌 Bus</option>
      <option value="Tram">🚋 Tram</option>
      <option value="Metro">🚇 Metro</option>
      <option value="Flight">✈️ Flight</option>
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
          <td>{{ new Date(r.timestamp).toLocaleString() }}</td>
          <td>{{ r.mode }}</td>
          <td>
            <template v-if="r.mode === 'Car'">
              Brand: {{ r.brand }}, Fuel: {{ r.fuel }}
              <br />
              {{ r.trips }} trips × {{ r.distance }} km/trip
              <br />
              Load: {{ r.extraLoad || 'None' }}
            </template>
            <template v-else-if="r.mode === 'Flight'">
              {{ r.flights }} flights × {{ r.hoursPerFlight }} hrs/flight
              <br />
              Airline: {{ r.airline || 'Generic' }}
              <br />
              Class: {{ r.flightClass || 'Economy' }}
            </template>
            <template v-else>
              {{ r.distance }} km/week
            </template>
          </td>
          <td>{{ r.emission }}</td>
          <td><button @click="openDetails(r)">Compare</button></td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:right;"><strong>Total Emissions</strong></td>
          <td><strong>{{ totalEmissions.toFixed(3) }}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <p v-else>No history yet.</p>

    <div v-if="selected" class="visualisation">
      <h3>What If Analysis for Entry on {{ new Date(selected.timestamp).toLocaleString() }}</h3>
      <p v-if="selected.mode === 'Car'">
        What if the same distance was traveled by different car brands (fuel: {{ selected.fuel }})?
      </p>
      <p v-else>
        What if the same distance was traveled using different transport modes?
      </p>
      <BarChart :data="chartData" :labels="chartLabels" />
      <button @click="selected = null">Close</button>
    </div>

    <div v-if="records.length" class="summary">
      <h3>Total Emissions: {{ totalEmissions.toFixed(3) }} tonnes CO₂</h3>
      <LineChart :data="lineChartData" />
    </div>
  </div>
</template>

<script>import { Bar, Line } from 'vue-chartjs';
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
  import ChartDataLabels from 'chartjs-plugin-datalabels';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    ChartDataLabels,
    TimeScale
  );

  export default {
    components: {
      BarChart: Bar,
      LineChart: Line
    },
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
          const matchesMode = !this.filter.mode || r.mode === this.filter.mode;
          const date = new Date(Date.parse(r.timestamp));
          const start = this.filter.startDate ? new Date(this.filter.startDate) : null;
          const end = this.filter.endDate ? new Date(this.filter.endDate) : null;
          const matchesStart = !start || date >= start;
          const matchesEnd = !end || date <= end;
          return matchesMode && matchesStart && matchesEnd;
        });
      },
      chartLabels() {
        if (!this.selected) return [];
        if (this.selected.mode === 'Car') return ['Toyota', 'Honda', 'Ford'];
        if (this.selected.mode === 'Flight') return ['Emirates', 'Air India', 'Qantas', 'Ryanair'];
        return ['Bus', 'Tram', 'Metro'];
      },
      chartData() {
        if (!this.selected) return [];

        const distance = this.selected.distance || 0;
        const trips = this.selected.trips || 1;

        if (this.selected.mode === 'Car') {
          const fuel = this.selected.fuel;
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
            toyota: 7.5,
            honda: 7.2,
            ford: 8.5
          };
          return {
            labels: this.chartLabels,
            datasets: [
              {
                label: 'Per-trip Emissions (tonnes)',
                data: this.chartLabels.map(b => {
                  const f = fuelEfficiency[b.toLowerCase()] || 0;
                  const e = emissionFactors[fuel] || 0;
                  return ((f / 100) * distance * e) / 1000;
                }),
                backgroundColor: '#42A5F5'
              }
            ]
          };
        }

        if (this.selected.mode === 'Flight') {
          const hours = this.selected.hoursPerFlight || 1;
          const flights = this.selected.flights || 1;
          const flightClass = this.selected.flightClass || 'economy';
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
          const multiplier = classMultipliers[flightClass] || 1;
          return {
            labels: this.chartLabels,
            datasets: [
              {
                label: 'Flight Emissions (tonnes)',
                data: this.chartLabels.map(a => {
                  const factor = emissionFactors[a.toLowerCase().replace(/ /g, '')] || 0.09;
                  return flights * hours * factor * multiplier;
                }),
                backgroundColor: '#FFCE56'
              }
            ]
          };
        }

        const factor = {
          Bus: 0.0001,
          Tram: 0.00007,
          Metro: 0.00006
        };

        return {
          labels: this.chartLabels,
          datasets: [
            {
              label: 'Weekly Emissions (tonnes)',
              data: this.chartLabels.map(mode => distance * factor[mode]),
              backgroundColor: '#66BB6A'
            }
          ]
        };
      },
      totalEmissions() {
        return this.filteredRecords.reduce((sum, r) => sum + parseFloat(r.emission), 0);
      },
      lineChartData() {
        const emissionsByDay = {};
        this.filteredRecords.forEach(r => {
          const date = new Date(Date.parse(r.timestamp));
          if (isNaN(date)) return;
          const day = date.toISOString().split('T')[0];
          emissionsByDay[day] = (emissionsByDay[day] || 0) + parseFloat(r.emission);
        });
        const sortedDays = Object.keys(emissionsByDay).sort((a, b) => new Date(a) - new Date(b));
        return {
          labels: sortedDays.map(day => new Date(day)),
          datasets: [
            {
              label: 'Daily Emissions (tonnes)',
              data: sortedDays.map(day => parseFloat(emissionsByDay[day].toFixed(4))),
              fill: false,
              borderColor: '#FF6384',
              backgroundColor: '#FF6384',
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7
            }
          ],
          options: {
            plugins: {
              datalabels: {
                align: 'top',
                anchor: 'end',
                formatter: value => value.toFixed(2),
                color: '#333',
                font: {
                  weight: 'bold'
                }
              }
            }
          }
        };

      }
    },
    methods: {
      openDetails(record) {
        this.selected = record;
      }
    },
    mounted() {
      this.records = JSON.parse(localStorage.getItem('emissionsRecords')) || [];
    }
  };</script>


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

<style scoped>
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

  .visualisation {
    margin-top: 3rem;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  }

  .summary {
    margin-top: 4rem;
    padding: 2rem;
    background: #e6f7ff;
    border-radius: 10px;
  }
</style>
