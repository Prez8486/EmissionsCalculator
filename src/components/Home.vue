<template>
  <div class="container">
    <h1>Transport Emissions Tracker</h1>
    <router-link to="/select-mode" class="btn">Add New Trip</router-link>
    <router-link to="/history" class="btn">View Trip History</router-link>
  </div>
</template>

<style scoped>
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
