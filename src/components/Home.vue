<template>
  <div class="container py-4">
    <h1 class="h3 mb-4">Emissions Dashboard</h1>

    <div class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Total Emissions</h5>
            <p class="card-text display-6">{{ totalEmissions.toFixed(2) }} t</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Most Common Mode</h5>
            <p class="card-text h5">{{ mostCommonMode }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Unique Trip Types</h5>
            <p class="card-text h5">{{ uniqueTripTypes.length }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Total Trips</h5>
            <p class="card-text h5">{{ filteredRecords.length }}</p>
          </div>
        </div>
      </div>
    </div>

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
    <!--navigation-->
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
      records: [],
      selected: null,
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
        const matchesMode = !this.filter.mode || r.mode === this.filter.mode;
        const date = new Date(Date.parse(r.timestamp));
        const start = this.filter.startDate ? new Date(this.filter.startDate) : null;
        const end = this.filter.endDate ? new Date(this.filter.endDate) : null;
        const matchesStart = !start || date >= start;
        const matchesEnd = !end || date <= end;
        return matchesMode && matchesStart && matchesEnd;
      });
    },
    totalEmissions() {
      return this.filteredRecords.reduce((sum, r) => sum + parseFloat(r.emission), 0);
    },
    mostCommonMode() {
      const counts = this.filteredRecords.reduce((acc, r) => {
        acc[r.mode] = (acc[r.mode] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    },
    uniqueTripTypes() {
      return [...new Set(this.filteredRecords.map(r => r.mode))];
    },
    chartLabels() {
      return this.uniqueTripTypes;
    },
    chartData() {
      const modeSums = {};
      this.filteredRecords.forEach(r => {
        modeSums[r.mode] = (modeSums[r.mode] || 0) + parseFloat(r.emission);
      });
      return {
        labels: this.chartLabels,
        datasets: [
          {
            label: 'Emissions by Transport Type (tonnes)',
            data: this.chartLabels.map(mode => modeSums[mode] || 0),
            backgroundColor: '#42A5F5'
          }
        ]
      };
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
        ]
      };
    }
  },
  mounted() {
    this.records = JSON.parse(localStorage.getItem('emissionsRecords')) || [];
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
