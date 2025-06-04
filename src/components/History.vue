<template>
  <div class="history-page">
    <!-- Page Header -->
    <div class="page-header">
      <h2>📊 Emissions History</h2>
      <p class="subtitle">Track your carbon footprint over time</p>
    </div>

    <!-- Monthly Emissions Chart -->
    <div class="chart-section">
      <h3>Monthly Emissions Overview</h3>
      <div class="chart-container">
        <LineChart
          v-if="monthlyChartData && monthlyChartData.labels && monthlyChartData.datasets"
          :data="monthlyChartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>📈 No emission data available yet</p>
          <p class="hint">Start tracking your trips to see your emissions trends!</p>
        </div>
      </div>
  </div>

<!-- Filters Section -->
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
            <option value="flight">✈️ Flight</option>
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

        <button @click="clearFilters" class="clear-btn">Clear Filters</button>
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

      <div class="table-container">
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
            <tr v-for="(record, index) in filteredRecords" :key="index">
              <td class="date-cell">
                {{ record.date ? new Date(record.date).toLocaleDateString() : 'N/A' }}
              </td>
              <td class="mode-cell">
                <span class="mode-badge" :class="record.transportMode.toLowerCase()">
                  {{ getModeIcon(record.transportMode) }} {{ record.transportMode }}
                </span>
              </td>
              <td class="details-cell">
                <div class="trip-details">
                  <template v-if="record.transportMode.toLowerCase() === 'car'">
                    <div><strong>Brand:</strong> {{ record.brand }}</div>
                    <div><strong>Fuel:</strong> {{ record.fuel }}</div>
                    <div><strong>Distance:</strong> {{ record.trips || 1 }} trips × {{ record.distanceKm }} km</div>
                    <div v-if="record.extraLoad"><strong>Load:</strong> {{ record.extraLoad }}</div>
                  </template>
                  <template v-else-if="record.transportMode.toLowerCase() === 'flight'">
                    <div><strong>Flights:</strong> {{ record.flights }} × {{ record.hoursPerFlight }} hrs</div>
                    <div v-if="record.airline"><strong>Airline:</strong> {{ record.airline }}</div>
                    <div><strong>Class:</strong> {{ record.flightClass || 'Economy' }}</div>
                  </template>
                  <template v-else>
                    <div><strong>Distance:</strong> {{ record.distanceKm }} km/week</div>
                  </template>
                </div>
              </td>
              <td class="emissions-cell">
                <span class="emissions-value">
                  {{ record.emissionKg ? (record.emissionKg / 1000).toFixed(3) : '0.000' }}
                </span>
              </td>
              <td class="actions-cell">
                <button @click="openDetails(record)" class="view-btn">
                  👁️ View
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="no-trips">
          <div class="empty-state">
            <div class="empty-icon">🚫</div>
            <h4>No trips found</h4>
            <p v-if="hasActiveFilters">Try adjusting your filters or clearing them to see more results.</p>
            <p v-else>You haven't recorded any trips yet. Start tracking your transportation to see your emissions!</p>
          </div>
        </div>
      </div>
    </div>
<!-- Trip Details Modal -->
    <div v-if="selected" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Trip Analysis</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="trip-info">
            <h4>{{ getModeIcon(selected.transportMode) }} {{ selected.transportMode }} Trip</h4>
            <p><strong>Date:</strong> {{ new Date(selected.date).toLocaleDateString() }}</p>
            <p><strong>Emissions:</strong> {{ selected.emissionKg ? (selected.emissionKg / 1000).toFixed(3) : '0.000' }} tonnes</p>
          </div>

          <div class="comparison-section">
            <h4>Alternative Transport Comparison</h4>
            <p class="comparison-text">
              <template v-if="selected.transportMode.toLowerCase() === 'car'">
                Compare emissions if you used different car brands with {{ selected.fuel }} fuel:
              </template>
              <template v-else-if="selected.transportMode.toLowerCase() === 'flight'">
                Compare emissions across different airlines and seat classes:
              </template>
              <template v-else>
                Compare emissions across different public transport modes:
              </template>
            </p>
            <div class="chart-container">
              <BarChart
                v-if="chartData && chartData.labels && chartData.datasets"
                :data="JSON.parse(JSON.stringify(chartData))"
                :options="barChartOptions"
              />
            </div>
          </div>
        </div>
      </div>
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
    name: 'History',
    components: { BarChart: Bar, LineChart: Line },
    data() {
      return {
        filter: {
          mode: '',
          startDate: '',
          endDate: ''
        },
        records: [],
        selected: null,
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Emissions Trend'
            },
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Emissions (tonnes)'
              }
            }
          }
        },
        barChartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Emissions (tonnes)'
              }
            }
          }
        }
      };
    },
    computed: {
      filteredRecords() {
        return this.records.filter(record => {
          const matchesMode = !this.filter.mode || record.transportMode.toLowerCase() === this.filter.mode;
          const recordDate = new Date(record.date);
          const startDate = this.filter.startDate ? new Date(this.filter.startDate) : null;
          const endDate = this.filter.endDate ? new Date(this.filter.endDate) : null;
          const matchesStart = !startDate || recordDate >= startDate;
          const matchesEnd = !endDate || recordDate <= endDate;
          return matchesMode && matchesStart && matchesEnd;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
      },
      totalEmissions() {
        return this.filteredRecords.reduce((sum, record) => {
          const emissions = parseFloat(record.emissionKg) / 1000;
          return isNaN(emissions) ? sum : sum + emissions;
        }, 0);
      },
      hasActiveFilters() {
        return this.filter.mode || this.filter.startDate || this.filter.endDate;
      },
      monthlyChartData() {
        if (!this.records.length) return null;

        const emissionsByMonth = {};

        this.records.forEach(record => {
          const date = new Date(record.date);
          if (isNaN(date)) return;

          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const emissions = parseFloat(record.emissionKg || record.emission) / 1000;

          if (!isNaN(emissions)) {
            emissionsByMonth[monthKey] = (emissionsByMonth[monthKey] || 0) + emissions;
          }
        });

        const sortedMonths = Object.keys(emissionsByMonth).sort();

        if (sortedMonths.length === 0) return null;

        return {
          labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }),
          datasets: [
            {
              label: 'Monthly Emissions (tonnes)',
              data: sortedMonths.map(month => parseFloat(emissionsByMonth[month].toFixed(4))),
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: '#007bff',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2
            }
          ]
        };
      },
      chartData() {
        if (!this.selected) return null;
        const record = this.selected;
        const distance = record.distanceKm || 0;

        if (record.transportMode.toLowerCase() === 'car') {
          const fuelEfficiency = { toyota: 7.5, honda: 7.2, ford: 8.5 };
          const emissionFactors = {
            unleaded91: 2.31, unleaded98: 2.34, e10: 2.12, diesel: 2.68,
            hybrid: 2.31, lpg: 1.51, electric: 0
          };
          const fuel = record.fuel || 'unleaded91';

          return {
            labels: ['Toyota', 'Honda', 'Ford'],
            datasets: [
              {
                label: 'Car Emissions (tonnes)',
                data: ['toyota', 'honda', 'ford'].map(brand => {
                  const consumption = (fuelEfficiency[brand] / 100) * distance;
                  const emissions = consumption * (emissionFactors[fuel] || 0) / 1000;
                  return emissions.toFixed(4);
                }),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726']
              }
            ]
          };
        } else if (record.transportMode.toLowerCase() === 'flight') {
          const hours = record.hoursPerFlight || 1;
          const flights = record.flights || 1;
          const emissionFactors = {
            emirates: 0.10, airindia: 0.11, qantas: 0.095, ryanair: 0.085
          };
          const classMultipliers = {
            economy: 1, business: 1.5, first: 2
          };
          const airlineNames = ['emirates', 'airindia', 'qantas', 'ryanair'];
          const seatClass = (record.flightClass || 'economy').toLowerCase();

          return {
            labels: airlineNames.map(airline => airline.charAt(0).toUpperCase() + airline.slice(1)),
            datasets: [
              {
                label: `${seatClass.charAt(0).toUpperCase() + seatClass.slice(1)} Class`,
                data: airlineNames.map(airline => {
                  const emissions = flights * hours * (emissionFactors[airline] || 0.09) * (classMultipliers[seatClass] || 1);
                  return emissions.toFixed(4);
                }),
                backgroundColor: '#FF6384'
              }
            ]
          };
        } else {
          const modes = ['Bus', 'Tram', 'Metro'];
          const factors = { Bus: 0.0001, Tram: 0.00007, Metro: 0.00006 };

          return {
            labels: modes,
            datasets: [
              {
                label: 'Weekly Emissions (tonnes)',
                data: modes.map(mode => (distance * factors[mode]).toFixed(4)),
                backgroundColor: '#66BB6A'
              }
            ]
          };
        }
      }
    },
    methods: {
      getModeIcon(mode) {
        const icons = {
          car: '🚗', bus: '🚌', tram: '🚋', metro: '🚇', flight: '✈️'
        };
        return icons[mode.toLowerCase()] || '🚌';
      },
      openDetails(record) {
        this.selected = record;
      },
      closeModal() {
        this.selected = null;
      },
      clearFilters() {
        this.filter = {
          mode: '',
          startDate: '',
          endDate: ''
        };
      },
      async fetchRecords() {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            this.$router.push('/login');
            return;
          }

          const response = await fetch('https://emissionscalculatorbackend.onrender.com/api/emissions/history', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.records && Array.isArray(data.records)) {
            this.records = data.records;
          } else {
            console.warn('No records found in response:', data);
            this.records = [];
          }
        } catch (error) {
          console.error('Failed to fetch records:', error);
          this.records = [];
        }
      }
    },
    mounted() {
      this.fetchRecords();
    }
  };
</script>

<style scoped>
  .history-page {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    overflow-x: hidden;
    max-width: 100vw;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .page-header h2 {
    color: #1f2937;
    margin: 0;
    font-size: 1.8rem;
  }

  .subtitle {
    color: #6b7280;
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
  }

  /* Chart Section */
  .chart-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .chart-section h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    font-size: 1.2rem;
  }

  .chart-container {
    height: 300px;
    position: relative;
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
  }

  .no-data p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.9rem;
    font-style: italic;
  }

  /* Filters Section */
  .filters-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .filters-section h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    font-size: 1.2rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    align-items: end;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }

  .filter-group select,
  .filter-group input {
    padding: 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .filter-group select:focus,
  .filter-group input:focus {
    outline: none;
    border-color: #007bff;
  }

  .clear-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .clear-btn:hover {
    background: #4b5563;
  }

  /* Table Section */
  .table-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .table-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.2rem;
  }

  .total-emissions {
    background: #eff6ff;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .total-label {
    color: #374151;
    margin-right: 0.5rem;
  }

  .total-value {
    font-weight: bold;
    color: #007bff;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }

  .date-cell {
    font-size: 0.9rem;
    color: #6b7280;
  }

  .mode-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .mode-badge.car { background: #dbeafe; color: #1e40af; }
  .mode-badge.bus { background: #dcfce7; color: #166534; }
  .mode-badge.tram { background: #fef3c7; color: #92400e; }
  .mode-badge.metro { background: #f3e8ff; color: #7c3aed; }
  .mode-badge.flight { background: #fee2e2; color: #dc2626; }

  .trip-details {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .trip-details div {
    margin-bottom: 0.2rem;
  }

  .emissions-value {
    font-weight: 600;
    color: #dc2626;
  }

  .view-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.2s;
  }

  .view-btn:hover {
    background: #0056b3;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h4 {
    margin: 0 0 1rem 0;
    color: #374151;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* Modal */
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
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .trip-info {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .trip-info h4 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .trip-info p {
    margin: 0.5rem 0;
    color: #6b7280;
  }

  .comparison-section h4 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .comparison-text {
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .history-page {
      padding: 0.5rem;
      padding: 1rem;
    }

    .chart-container {
      height: 250px;
    }

    .filters {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group {
      width: 100%;
    }

    .table-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .modal {
      padding: 0.5rem;
    }

    .modal-content {
      max-height: 90vh;
    }
  }
</style>
