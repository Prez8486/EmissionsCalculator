<template>
  <div class="leaderboard">
    <h2>🌿 Emission Leaderboard</h2>
    <div v-if="loading" class="loading">Loading leaderboard...</div>
    <table v-else-if="leaders.length">
      <thead>
        <tr>
          <th>Rank</th>
          <th>User</th>
          <th>Total Emissions (tonnes)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in leaders" :key="user.userId">
          <td>{{ index + 1 }}</td>
          <td>{{ user.name || 'Anonymous' }}</td>
          <td>{{ (user.totalEmission / 1000).toFixed(3) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No leaderboard data available.</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      leaders: [],
      loading: true
    };
  },
  async mounted() {
    await this.loadLeaderboard();
  },
  methods: {
    async loadLeaderboard() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          this.$router.push('/login');
          return;
        }

        const res = await fetch("https://emissionscalculatorbackend-1.onrender.com/api/emissions/leaderboard", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            this.$router.push('/login');
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.leaderboard) {
          // Fix: Sort by highest emissions first (descending order)
          this.leaders = data.leaderboard.sort((a, b) => b.totalEmission - a.totalEmission);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        this.leaders = [];
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
  .leaderboard {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 1rem;
    text-align: center;
  }

  th {
    background: #f0f0f0;
    font-weight: bold;
  }
</style>
