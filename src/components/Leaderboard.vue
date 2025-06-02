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

<script>export default {
  data() {
    return {
      leaders: []
    };
  },
  async mounted() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/emissions/leaderboard", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.leaderboard) {
        this.leaders = data.leaderboard.sort((a, b) => a.totalEmission - b.totalEmission);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  }
};</script>

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
