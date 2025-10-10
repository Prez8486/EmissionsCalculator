<template>
  <div class="leaderboard">
    <h2>🌿 Emission Leaderboard</h2>
    <table v-if="leaders.length">
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
  import { API_BASE } from '@/config/apiConfig.js';

  export default {
    data() {
      return {
        leaders: []
      };
    },
    async mounted() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${ API_BASE }/emissions/leaderboard`, {
          headers: {
            Authorization: `Bearer ${ token }`
        }
      });

    const data = await res.json();

    if(Array.isArray(data.leaderboard)) {
    // 🟩 Convert totalEmission to number safely before sorting
    this.leaders = data.leaderboard
      .map(user => {
        let emission = 0;

        // Extract number safely from totalEmission field
        if (user.totalEmission !== undefined && user.totalEmission !== null) {
          // Handle possible strings like "1.23" or "1.23 tonnes"
          const match = String(user.totalEmission).match(/[\d.]+/);
          emission = match ? parseFloat(match[0]) : 0;
        }

        return {
          ...user,
          totalEmission: emission
        };
      })
      .sort((a, b) => b.totalEmission - a.totalEmission); // ascending
  } else {
    console.warn("Invalid leaderboard format:", data);
  }

    } catch (err) {
    console.error("❌ Failed to load leaderboard:", err);
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
