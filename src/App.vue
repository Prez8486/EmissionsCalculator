<template>
  <div id="app">
    <header>
      <h1>Transport Emissions Tracker</h1>
      <nav>
        <template v-if="isLoggedIn">
          <router-link to="/home">Home</router-link>
          <router-link to="/select-mode">Add Trip</router-link>
          <router-link to="/history">History</router-link>
          <router-link to="/leaderboard">Leaderboard</router-link>
          <a href="#" @click.prevent="logout">Logout</a>
        </template>
        <template v-else>
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Register</router-link>
        </template>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
  export default {
    name: 'App',
    data() {
      return {
        isLoggedIn: false
      };
    },
    methods: {
      checkAuth() {
        this.isLoggedIn = !!localStorage.getItem('token');
      },
      logout() {
        localStorage.removeItem('token');
        this.isLoggedIn = false;
        this.$router.push('/login');
      }
    },
    created() {
      this.checkAuth();
    },
    watch: {
      '$route'() {
        this.checkAuth();
      }
    }
  };
</script>

<style>
  body {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background-color: #f3f4f6;
  }

  #app {
    max-width: 960px;
    margin: auto;
    padding: 2rem;
  }

  header {
    background-color: #007bff;
    color: white;
    padding: 1rem;
    text-align: center;
    border-radius: 8px;
  }

  nav {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }

    nav a {
      color: white;
      text-decoration: none;
      font-weight: bold;
    }

      nav a.router-link-active {
        text-decoration: underline;
      }

  main {
    margin-top: 2rem;
  }
</style>
