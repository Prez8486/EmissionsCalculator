<template>
  <div class="container py-4">
    <h1 class="h3 mb-4">Emissions Dashboard</h1>

    <div class="row mb-4">
      <div class="col-md-3 mb-3" v-for="(card, i) in cards" :key="i">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text h5">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isAndroid">Hello</div>
    <div class="row">
      <div class="col-lg-6 mb-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Daily Emissions</h5>
            <LineChart :data="lineChartData" />
          </div>
        </div>
      </div>
      <div class="col-lg-6 mb-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Trip Breakdown</h5>
            <BarChart :data="chartData" />
          </div>
        </div>
      </div>
    </div>

    <router-link to="/select-mode" class="btn">Add New Trip</router-link>
    <router-link to="/history" class="btn">View Trip History</router-link>
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
    TimeScale,
    ChartDataLabels
  );

  export default {
    components: {
      BarChart: Bar,
      LineChart: Line
    },
    data() {
      return {
        records: [],
        filter: {
          mode: '',
          startDate: '',
          endDate: ''
        }
      };
    },
    computed: {
      filteredRecords() {
        return this.records.filter(r => {
          const matchesMode = !this.filter.mode || r.transportMode.toLowerCase() === this.filter.mode.toLowerCase();
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
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      },
      uniqueTripTypes() {
        return [...new Set(this.filteredRecords.map(r => r.transportMode || r.mode))];
      },
      chartLabels() {
        return this.uniqueTripTypes;
      },
      chartData() {
        const modeSums = {};
        this.filteredRecords.forEach(r => {
          const mode = r.transportMode || r.mode;
          modeSums[mode] = (modeSums[mode] || 0) + parseFloat(r.emissionKg || r.emission) / 1000;
        });
        return {
          labels: this.chartLabels,
          datasets: [
            {
              label: 'Emissions by Transport Type (tonnes)',
              data: this.chartLabels.map(mode => (modeSums[mode] || 0).toFixed(4)),
              backgroundColor: '#42A5F5'
            }
          ]
        };
      },
      lineChartData() {
        const emissionsByDay = {};

        this.filteredRecords.forEach(r => {
          const date = new Date(r.date);
          if (isNaN(date)) return;
          const day = date.toISOString().split('T')[0];
          emissionsByDay[day] = (emissionsByDay[day] || 0) + (parseFloat(r.emissionKg || r.emission) / 1000);
        });

        const sortedDays = Object.keys(emissionsByDay).sort((a, b) => new Date(a) - new Date(b));

        return {
          labels: sortedDays.map(day =>
            new Date(day).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short'
            })
          ),
          datasets: [
            {
              label: 'Daily Emissions (tonnes)',
              data: sortedDays.map(day => parseFloat(emissionsByDay[day].toFixed(4))),
              borderColor: '#FF6384',
              backgroundColor: '#FF6384',
              fill: false,
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7
            }
          ]
        };
      }
      ,
      cards() {
        console.log(this.totalEmissions.toFixed(2));
        return [
          { title: 'Total Emissions', value: this.totalEmissions.toFixed(2) + ' t' },
          { title: 'Most Common Mode', value: this.mostCommonMode },
          { title: 'Unique Trip Types', value: this.uniqueTripTypes.length },
          { title: 'Total Trips', value: this.filteredRecords.length }
        ];
      }
    },
    async mounted() {
      this.isAndroid = /Android/i.test(navigator.userAgent);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://emissionscalculatorbackend.onrender.com/api/emissions/history', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.records) {
          this.records = data.records;
        }
      } catch (err) {
        console.error('Failed to fetch records:', err);
      }
    }
  };
</script>

<style scoped>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f9f9f9;
  }

  .container {
    text-align: center;
    margin-top: 3rem;
    padding: 1rem;
  }

  .btn {
    display: inline-block;
    margin: 1em;
    padding: 1em 2em;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 8px;
  }
</style>
